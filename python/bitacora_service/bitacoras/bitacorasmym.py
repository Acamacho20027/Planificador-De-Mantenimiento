"""
Script para procesar un chat de WhatsApp de mantenimiento y generar
una bitácora de mantenimientos 2026 en Excel.

Requisitos de librerías:
- pandas
- openpyxl

Ejecutar: python procesar_whatsapp.py
"""
import glob
import os
import re
from datetime import datetime
from typing import List, Dict, Optional
files= glob.glob("*.txt")  # Buscar archivos .txt en el directorio actual
import pandas as pd

# Palabras clave para clasificar mensajes
REQUEST_KEYWORDS = [
    "no sirve",
    "no funciona",
    "danado",
    "dañado",
    "revisar",
    "mantenimiento",
    "aire",
    "bomba",
    "luz",
    "fuga",
]

CONFIRMATION_KEYWORDS = [
    "listo",
    "reparado",
    "solucionado",
    "funcionando",
    "ya quedo",
    "ya quedó",
    "ya sirve",
]

REPORTER_NAME = "Randall"
CHAT_FILE = "chat_whatsapp.txt"
OUTPUT_FILE = "bitacora_mantenimiento_2026.xlsx"

# Regex para líneas del chat: DD/MM/YYYY HH:MM - Nombre: Mensaje
LINE_REGEX = re.compile(
    r"""
    ^\[
    (?P<date>\d{1,2}/\d{1,2}/\d{2,4}),\s+
    (?P<time>\d{1,2}:\d{2}:\d{2})\s*
    (?P<ampm>a\.?\s?m\.?|p\.?\s?m\.?)
    \]\s+
    (?P<author>[^:]+):
    \s*(?P<message>.*)
    $
    """,
    re.VERBOSE | re.IGNORECASE
)



def parse_line(line: str) -> Optional[Dict]:
    """Devuelve un diccionario con los campos de la línea si cumple el formato esperado."""
    match = LINE_REGEX.match(line.strip())
    if not match:
        return None
    date_str = match.group("date")
    time_str = match.group("time")
    ampm = match.group("ampm")

    try:
        day, month, year = map(int, date_str.split("/"))
    except ValueError:
        return None

    if year < 100:
        year += 2000

    try:
        hour, minute, second = map(int, time_str.split(":"))
    except ValueError:
        return None

    ampm_normalized = ampm.replace(".", "").replace(" ", "").lower()
    if ampm_normalized.startswith("p") and hour < 12:
        hour += 12
    if ampm_normalized.startswith("a") and hour == 12:
        hour = 0

    try:
        timestamp = datetime(year, month, day, hour, minute, second)
    except ValueError:
        return None

    # salida de depuración del match original
    print(match.groupdict())
    # Solo considerar año 2026 según requerimiento
    if timestamp.year != 2026:
        return None
    return {
        "datetime": timestamp,
        "author": match.group("author").strip(),
        "message": match.group("message").strip(),
    }


def parse_chat(file_path: str) -> List[Dict]:
    """Lee el chat y arma una lista de mensajes con manejo básico de errores."""
    messages: List[Dict] = []
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"No se encontró el archivo: {file_path}")

    current: Optional[Dict] = None
    malformed_lines: List[str] = []

    with open(file_path, "r", encoding="utf-8") as f:
        for raw_line in f:
            parsed = parse_line(raw_line)
            if parsed:
                if "imagen omitida" in parsed["message"].lower():
                    continue
                if current:
                    messages.append(current)
                current = parsed
            else:
                # Se trata como continuación si hay mensaje en curso; si no, se registra como malformado
                cleaned = raw_line.strip()
                if current and cleaned:
                    current["message"] += " " + cleaned
                elif cleaned:
                    malformed_lines.append(cleaned)

    if current:
        messages.append(current)

    if malformed_lines:
        print(f"Advertencia: {len(malformed_lines)} líneas no coincidieron con el formato esperado y se omitieron.")

    return messages


def contains_keyword(text: str, keywords: List[str]) -> bool:
    """Evalúa si algún keyword aparece en el texto (insensible a mayúsculas y tildes faltantes)."""
    normalized = text.lower()
    return any(kw in normalized for kw in keywords)


def is_request(msg: Dict) -> bool:
    """Determina si el mensaje es una solicitud de mantenimiento."""
    return msg["author"].strip().lower() == REPORTER_NAME.lower() or contains_keyword(msg["message"], REQUEST_KEYWORDS)


def is_confirmation(msg: Dict) -> bool:
    """Determina si el mensaje indica trabajo completado."""
    return contains_keyword(msg["message"], CONFIRMATION_KEYWORDS)


def link_requests_and_confirmations(messages: List[Dict]) -> List[Dict]:
    """Asocia cada solicitud con la primera confirmación posterior en el chat."""
    requests: List[Dict] = []
    for msg in messages:
        if is_request(msg):
            requests.append({
                "request": msg,
                "confirmation": None,
            })
        elif is_confirmation(msg):
            # asignar a la primera solicitud pendiente
            for req in requests:
                if req["confirmation"] is None and req["request"]["datetime"] <= msg["datetime"]:
                    req["confirmation"] = msg
                    break
    return requests


def build_dataframe(requests: List[Dict]) -> pd.DataFrame:
    """Convierte las solicitudes y confirmaciones en un DataFrame listo para Excel."""
    rows = []
    for item in requests:
        req = item["request"]
        conf = item.get("confirmation")
        rows.append({
            "Fecha Solicitud": req["datetime"],
            "Reportado Por": req["author"],
            "Descripcion del Problema": req["message"],
            "Tecnico / Respondio": conf["author"] if conf else "",
            "Estado": "Completado" if conf else "Pendiente",
            "Fecha Cierre": conf["datetime"] if conf else None,
        })
    df = pd.DataFrame(rows)
    # Asegurar tipos de fecha para que Excel los maneje como fecha/hora
    if not df.empty:
        df["Fecha Solicitud"] = pd.to_datetime(df["Fecha Solicitud"])
        df["Fecha Cierre"] = pd.to_datetime(df["Fecha Cierre"])
    return df


def _add_key_column(df: pd.DataFrame) -> pd.DataFrame:
    """Agrega columna temporal 'clave' para identificar registros únicos."""
    if df.empty:
        df["clave"] = []
        return df

    df_copy = df.copy()
    df_copy["Fecha Solicitud"] = pd.to_datetime(df_copy["Fecha Solicitud"])
    df_copy["Fecha Cierre"] = pd.to_datetime(df_copy["Fecha Cierre"])
    df_copy["clave"] = (
        df_copy["Fecha Solicitud"].dt.strftime("%Y-%m-%d %H:%M:%S")
        + "|" + df_copy["Reportado Por"].fillna("").astype(str)
        + "|" + df_copy["Descripcion del Problema"].fillna("").astype(str)
    )
    return df_copy


def export_to_excel(df: pd.DataFrame, output_path: str) -> None:
    """Exporta a Excel agregando solo mantenimientos nuevos sin duplicados."""
    # Construir clave en los nuevos registros
    new_df = _add_key_column(df)

    if os.path.exists(output_path):
        try:
            existing_df = pd.read_excel(output_path, engine="openpyxl")
        except Exception as exc:  # pragma: no cover - lectura defensiva
            print(f"No se pudo leer el Excel existente ({exc}); se regenerará completo.")
            existing_df = pd.DataFrame(columns=df.columns)
        existing_df = _add_key_column(existing_df)

        # Filtrar solo los nuevos cuya clave no existe
        existing_keys = set(existing_df["clave"].dropna().tolist())
        filtered_new = new_df[~new_df["clave"].isin(existing_keys)]

        merged = pd.concat([existing_df, filtered_new], ignore_index=True)
        merged = merged.drop(columns=["clave"], errors="ignore")
    else:
        merged = new_df.drop(columns=["clave"], errors="ignore")

    merged.to_excel(output_path, index=False, engine="openpyxl")
    print(f"Archivo generado: {output_path}")


def main() -> None:
    """Flujo principal: leer chat, procesar, generar Excel."""
    try:
        messages = parse_chat(CHAT_FILE)
    except FileNotFoundError as exc:
        print(str(exc))
        return

    if not messages:
        print("No se encontraron mensajes válidos para 2026 en el chat.")
        return

    requests = link_requests_and_confirmations(messages)
    if not requests:
        print("No se identificaron solicitudes de mantenimiento.")
        return

    df = build_dataframe(requests)
    export_to_excel(df, OUTPUT_FILE)


if __name__ == "__main__":
    main()
