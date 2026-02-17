"""
Procesador basado en bitacorasmym.py.
Soporta actualización incremental: omite registros ya existentes en el Excel y solo agrega los nuevos.
El archivo se guarda por cliente y año (ej: bitacora_cliente_2026.xlsx); enero y febrero se acumulan en el mismo archivo.
"""
import os
import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple

import pandas as pd

# Marcadores de contenido multimedia/sistema que se ignoran como texto útil
IMAGE_MARKERS = ["imagen omitida", "image omitted"]
MEDIA_MARKERS = ["audio omitted", "video omitted"]
SYSTEM_MARKERS = [
    "messages and calls are end-to-end encrypted",
    "mensajes y llamadas están cifrados de extremo a extremo",
    "unknown user created this group",
    "unknown user",
    "this message was deleted",
    "se eliminó este mensaje",
]

# Palabras clave para clasificar solicitudes de mantenimiento (estilo WhatsApp / lenguaje coloquial)
REQUEST_KEYWORDS = [
    "no sirve", "no funciona", "no trabaja",
    "dañado", "danado", "dañada", "roto", "rota", "se quebró", "se quebro", "quebraron",
    "se rompió", "se rompio", "averiado", "averiada", "malo", "mala", "favor", "pintar", "armar", "pasar",
    "revisar", "reparar", "arreglar", "arreglo", "mover", "reemplazo",
    "mantenimiento", "mantenimiento correctivo",
    "aire", "a/c", "ac ", "aire acondicionado",
    "bomba", "bombas", "electrobomba",
    "luz", "luces", "iluminacion", "iluminación", "foco", "focos",
    "fuga", "fugas", "gotea", "goteando", "goteo",
    "closet", "clóset", "sanitario", "baño", "bano",
    "puerta", "ventana", "techo", "lamina", "lámina",
    "inodoro", "lavamanos", "grifo", "llave",
    "enchufe", "tomacorriente", "breaker", "tablero",
    "cerradura", "bisagra", "pasador", "corregir", "corrección", "correccion", "ajustar", "ajuste", "ajustada", "ajustado", "urgente",
]

CONFIRMATION_KEYWORDS = [
    "listo", "listo ", "listo.", "listo!",
    "reparado", "reparada", "reparado.", "reparación",
    "solucionado", "solucionada",
    "funcionando", "funciona", "ya funciona",
    "ya quedo", "ya quedó", "ya quedo.", "quedó listo",
    "ya sirve", "ya está", "ya esta", "listo para",
    "completado", "completada", "terminado", "terminada",
    "atendido", "atendida", "realizado", "realizada", "la medida", "medida tomada", "ok", "ok.", "okay",
]

REPORTER_NAME = "Randall"
OUTPUT_FILE = "bitacora_mantenimiento_2026.xlsx"

# Regex original
LINE_REGEX = re.compile(
    r"""
    ^[\u200e\u200f\u202a-\u202e\ufeff\s]*\[\s*
    (?P<date>\d{1,2}/\d{1,2}/\d{2,4}),\s*
    (?P<time>\d{1,2}:\d{2}:\d{2})\s*
    (?P<ampm>[ap]\.?(?:\s)?m\.?|am|pm|a\s?m|p\s?m)
    \]\s+
    (?P<author>[^:]+):
    \s*(?P<message>.*)
    $
    """,
    re.VERBOSE | re.IGNORECASE
)


def parse_line(line: str, filter_year_month: Optional[Tuple[int, int]] = None) -> Optional[Dict]:
    """Parsea una línea del chat. Si filter_year_month=(año, mes), solo devuelve mensajes de ese periodo."""
    def _normalize(s: str) -> str:
        # Limpia caracteres invisibles que suelen traer los txt exportados de WhatsApp
        cleaned = s.replace("\u202f", " ").replace("\u00a0", " ")
        cleaned = cleaned.replace("\u200e", "").replace("\u200f", "")
        cleaned = cleaned.replace("\ufeff", "").replace("\u2060", "")
        cleaned = cleaned.replace("\u202a", "").replace("\u202b", "").replace("\u202c", "").replace("\u202d", "").replace("\u202e", "")
        return cleaned.strip()

    normalized_line = _normalize(line)
    match = LINE_REGEX.match(normalized_line)
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

    if filter_year_month:
        fy, fm = filter_year_month
        if year != fy or month != fm:
            return None

    author = match.group("author").strip()
    author = author.lstrip("~•- ")
    author = author.replace("\u202f", " ").replace("\u00a0", " ").strip()

    return {
        "datetime": timestamp,
        "author": author,
        "message": match.group("message").strip(),
    }


def parse_chat(file_path: str, filter_year_month: Optional[Tuple[int, int]] = None) -> List[Dict]:
    messages: List[Dict] = []
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"No se encontró el archivo: {file_path}")

    current: Optional[Dict] = None
    malformed_lines: List[str] = []

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        for raw_line in f:
            parsed = parse_line(raw_line, filter_year_month)
            if parsed:
                msg_lower = parsed["message"].lower()
                if any(marker in msg_lower for marker in IMAGE_MARKERS):
                    continue
                if any(marker in msg_lower for marker in MEDIA_MARKERS):
                    continue
                if any(marker in msg_lower for marker in SYSTEM_MARKERS):
                    continue
                if current:
                    messages.append(current)
                current = parsed
            else:
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


def parse_chat_folder_with_stats(source_dir: Path, filter_year_month: Optional[Tuple[int, int]] = None) -> Tuple[List[Dict], List[Dict]]:
    """Lee y concatena todos los .txt del directorio de bitácoras, retornando mensajes y estadísticas por archivo."""
    txt_files = sorted(p for p in Path(source_dir).glob("*.txt") if p.is_file())
    if not txt_files:
        raise FileNotFoundError(f"No se encontraron archivos .txt en {source_dir}")

    all_messages: List[Dict] = []
    stats: List[Dict] = []

    for path in txt_files:
        parsed_msgs: List[Dict] = []
        line_count = 0
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                for raw in f:
                    line_count += 1
                    parsed = parse_line(raw, filter_year_month)
                    if parsed:
                        msg_lower = parsed["message"].lower()
                        if any(marker in msg_lower for marker in IMAGE_MARKERS):
                            continue
                        if any(marker in msg_lower for marker in MEDIA_MARKERS):
                            continue
                        if any(marker in msg_lower for marker in SYSTEM_MARKERS):
                            continue
                        parsed_msgs.append(parsed)
        except Exception as exc:
            print(f"No se pudo leer {path.name}: {exc}")
            stats.append({"file": path.name, "lines": line_count, "parsed": len(parsed_msgs), "error": str(exc)})
            continue

        if not parsed_msgs:
            print(f"Advertencia: {path.name} no generó mensajes parseados (líneas leídas: {line_count}). Revise el formato.")

        all_messages.extend(parsed_msgs)
        stats.append({"file": path.name, "lines": line_count, "parsed": len(parsed_msgs), "error": None})

    all_messages.sort(key=lambda m: m["datetime"])
    return all_messages, stats


def parse_chat_folder(source_dir: Path, filter_year_month: Optional[Tuple[int, int]] = None) -> List[Dict]:
    messages, _stats = parse_chat_folder_with_stats(source_dir, filter_year_month)
    return messages


def contains_keyword(text: str, keywords: List[str]) -> bool:
    normalized = text.lower()
    return any(kw in normalized for kw in keywords)


def is_request(msg: Dict) -> bool:
    if not msg.get("message", "").strip():
        return False
    if is_confirmation(msg):
        return False
    # Considerar solicitud cualquier mensaje que no sea confirmación; las palabras clave priorizan mantenimiento
    return True


def is_confirmation(msg: Dict) -> bool:
    return contains_keyword(msg["message"], CONFIRMATION_KEYWORDS)


def link_requests_and_confirmations(messages: List[Dict]) -> List[Dict]:
    requests: List[Dict] = []
    for msg in messages:
        if is_request(msg):
            requests.append({"request": msg, "confirmation": None})
        elif is_confirmation(msg):
            for req in reversed(requests):
                if req["confirmation"] is None and req["request"]["datetime"] <= msg["datetime"]:
                    req["confirmation"] = msg
                    break
    return requests


def build_dataframe(requests: List[Dict]) -> pd.DataFrame:
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
    if not df.empty:
        df["Fecha Solicitud"] = pd.to_datetime(df["Fecha Solicitud"])
        df["Fecha Cierre"] = pd.to_datetime(df["Fecha Cierre"])
    return df


def _add_key_column(df: pd.DataFrame) -> pd.DataFrame:
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


def export_to_excel(df: pd.DataFrame, output_path: str) -> Dict:
    """
    Guarda el Excel. Si el archivo ya existe, lee los registros existentes, omite duplicados
    (por clave única: Fecha Solicitud + Reportado Por + Descripcion) y solo agrega los nuevos.
    Ordena el resultado por Fecha Solicitud para ver enero, febrero, etc. en orden cronológico.
    Retorna: { new_records_added, total_rows, was_updated }
    """
    new_df = _add_key_column(df)

    if os.path.exists(output_path):
        try:
            existing_df = pd.read_excel(output_path, engine="openpyxl")
        except Exception as exc:
            print(f"No se pudo leer el Excel existente ({exc}); se regenerará completo.")
            existing_df = pd.DataFrame(columns=df.columns if not df.empty else [])
        if existing_df.empty:
            existing_df = pd.DataFrame(columns=new_df.columns)
        existing_df = _add_key_column(existing_df)

        existing_keys = set(existing_df["clave"].dropna().tolist())
        filtered_new = new_df[~new_df["clave"].isin(existing_keys)]
        new_records_added = len(filtered_new)

        if new_records_added == 0:
            # No hay registros nuevos; mantener el archivo como está
            total_rows = len(existing_df)
            return {"new_records_added": 0, "total_rows": total_rows, "was_updated": False}

        merged = pd.concat([existing_df, filtered_new], ignore_index=True)
        merged = merged.drop(columns=["clave"], errors="ignore")
        merged["Fecha Solicitud"] = pd.to_datetime(merged["Fecha Solicitud"])
        merged["Fecha Cierre"] = pd.to_datetime(merged["Fecha Cierre"], errors="coerce")
        merged = merged.sort_values("Fecha Solicitud").reset_index(drop=True)
        merged.to_excel(output_path, index=False, engine="openpyxl")
        total_rows = len(merged)
        print(f"Archivo actualizado: {output_path} — {new_records_added} registros nuevos, {total_rows} total")
        return {"new_records_added": new_records_added, "total_rows": total_rows, "was_updated": True}
    else:
        merged = new_df.drop(columns=["clave"], errors="ignore")
        if not merged.empty:
            merged = merged.sort_values("Fecha Solicitud").reset_index(drop=True)
        merged.to_excel(output_path, index=False, engine="openpyxl")
        total_rows = len(merged)
        print(f"Archivo generado: {output_path} — {total_rows} registros")
        return {"new_records_added": total_rows, "total_rows": total_rows, "was_updated": True}


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", value or "sin_cliente")
    return cleaned.strip("_") or "sin_cliente"


def _parse_period(period: Optional[str]) -> Optional[Tuple[int, int]]:
    """Convierte 'YYYY-MM' en (año, mes)."""
    if not period or not isinstance(period, str):
        return None
    parts = period.strip().split("-")
    if len(parts) != 2:
        return None
    try:
        y, m = int(parts[0]), int(parts[1])
        if 1 <= m <= 12 and 2000 <= y <= 2100:
            return (y, m)
    except ValueError:
        pass
    return None


def procesar_bitacora(cliente: Optional[str], period: Optional[str], source_dir: Path, output_dir: Path) -> Dict:
    """
    Procesa la bitácora. Si period es YYYY-MM, solo procesa mensajes de ese mes.
    El Excel se guarda por cliente y año (ej: bitacora_cliente_2026.xlsx).
    Enero y febrero se acumulan en el mismo archivo; se omiten duplicados.
    """
    filter_year_month = _parse_period(period)
    messages, file_stats = parse_chat_folder_with_stats(Path(source_dir), filter_year_month)
    if not messages:
        return {
            "path": None, "rows": 0, "new_records_added": 0, "total_rows": 0,
            "year": None, "filename": None, "lines_read": 0, "lines_valid": 0, "file_stats": file_stats
        }

    requests = link_requests_and_confirmations(messages)
    if not requests:
        return {
            "path": None, "rows": 0, "new_records_added": 0, "total_rows": 0,
            "year": None, "filename": None, "lines_read": 0, "lines_valid": 0, "file_stats": file_stats
        }

    df = build_dataframe(requests)
    if df.empty:
        return {
            "path": None, "rows": 0, "new_records_added": 0, "total_rows": 0,
            "year": None, "filename": None, "lines_read": len(messages), "lines_valid": len(messages), "file_stats": file_stats
        }

    # Año para el nombre del archivo: del periodo o del primer registro
    if filter_year_month:
        year = filter_year_month[0]
    else:
        try:
            year = int(pd.to_datetime(df["Fecha Solicitud"]).iloc[0].year)
        except Exception:
            year = datetime.utcnow().year

    output_dir.mkdir(parents=True, exist_ok=True)
    safe_cliente = slugify(cliente or "cliente")
    output_file = output_dir / f"bitacora_{safe_cliente}_{year}.xlsx"

    export_result = export_to_excel(df, str(output_file))

    return {
        "path": output_file,
        "rows": len(df),
        "new_records_added": export_result["new_records_added"],
        "total_rows": export_result["total_rows"],
        "year": year,
        "filename": output_file.name,
        "lines_read": len(messages),
        "lines_valid": len(messages),
        "file_stats": file_stats,
    }


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    source_dir = base_dir / "bitacoras"
    try:
        messages = parse_chat_folder(source_dir)
    except FileNotFoundError as exc:
        print(str(exc))
        return
    if not messages:
        print("No se encontraron mensajes válidos en el chat.")
        return

    requests = link_requests_and_confirmations(messages)
    if not requests:
        print("No se identificaron solicitudes de mantenimiento.")
        return

    df = build_dataframe(requests)
    export_to_excel(df, str(base_dir / OUTPUT_FILE))


if __name__ == "__main__":
    main()
