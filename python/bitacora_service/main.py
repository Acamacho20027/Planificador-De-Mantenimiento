"""
Microservicio FastAPI para procesar bitácoras y generar un único Excel fijo.
Contexto actual: un solo cliente/sede y un único archivo que se actualiza diariamente.
"""
import glob
import os
import re
import uuid
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
BITACORA_SOURCE_DIR = Path(
    os.getenv(
        "BITACORA_SOURCE_DIR",
        r"C:\\Users\\Santiago Marin\\Desktop\\Bitacora de mant\\txt"
    )
)
BITACORA_OUTPUT_DIR = Path(
    os.getenv("BITACORA_OUTPUT_DIR") or (BASE_DIR / "output")
)
BITACORA_FIXED_NAME = os.getenv("BITACORA_FIXED_NAME", "bitacora_mantenimiento_2026.xlsx")
BITACORA_DEFAULT_CLIENTE = os.getenv("BITACORA_DEFAULT_CLIENTE", "Cliente Único")

BITACORA_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

EXPECTED_FIELDS = [
    "fecha",
    "cliente",
    "tecnico",
    "tarea",
    "estado",
    "observaciones",
]

FIELD_ALIASES = {
    "fecha": "fecha",
    "fecha_ingreso": "fecha",
    "f": "fecha",
    "cliente": "cliente",
    "empresa": "cliente",
    "compania": "cliente",
    "tecnico": "tecnico",
    "tecnicos": "tecnico",
    "responsable": "tecnico",
    "tarea": "tarea",
    "actividad": "tarea",
    "trabajo": "tarea",
    "estado": "estado",
    "estatus": "estado",
    "observaciones": "observaciones",
    "obs": "observaciones",
    "comentarios": "observaciones",
}

DATE_PATTERNS = [
    "%Y-%m-%d",
    "%d-%m-%Y",
    "%d/%m/%Y",
    "%Y/%m/%d",
    "%Y%m%d",
]


class ProcessRequest(BaseModel):
    cliente: Optional[str] = None
    period: Optional[str] = None  # YYYY-MM opcional (compatibilidad futura)


class MetricResponse(BaseModel):
    total_registros: int
    clientes: Dict[str, int]
    estados: Dict[str, int]
    periodos: Dict[str, int]


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", value or "sin_cliente")
    return cleaned.strip("_") or "sin_cliente"


def parse_date(value: str, fallback: datetime) -> datetime:
    if not value:
        return fallback
    for pattern in DATE_PATTERNS:
        try:
            return datetime.strptime(value.strip(), pattern)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(value.strip())
    except Exception:
        return fallback


def normalize_field(key: str) -> Optional[str]:
    if not key:
        return None
    key_low = key.strip().lower()
    return FIELD_ALIASES.get(key_low)


def parse_structured_line(line: str) -> Optional[Dict[str, str]]:
    separators = [";", "|", ","]
    for sep in separators:
        if sep in line:
            parts = [p.strip() for p in line.split(sep)]
            if len(parts) >= 4:
                record = {
                    "fecha": parts[0] if len(parts) > 0 else "",
                    "cliente": parts[1] if len(parts) > 1 else "",
                    "tecnico": parts[2] if len(parts) > 2 else "",
                    "tarea": parts[3] if len(parts) > 3 else "",
                    "estado": parts[4] if len(parts) > 4 else "",
                    "observaciones": sep.join(parts[5:]) if len(parts) > 5 else "",
                }
                return record
    return None


def parse_key_value_lines(lines: List[str]) -> Dict[str, str]:
    record: Dict[str, str] = {field: "" for field in EXPECTED_FIELDS}
    leftovers: List[str] = []
    for line in lines:
        if ":" in line:
            key, _, val = line.partition(":")
        elif "-" in line and re.match(r"^[A-Za-z]+\s*-", line):
            key, _, val = line.partition("-")
        else:
            leftovers.append(line)
            continue
        target = normalize_field(key)
        if target:
            record[target] = val.strip()
        else:
            leftovers.append(line)
    if leftovers and not record.get("observaciones"):
        record["observaciones"] = " | ".join([v.strip() for v in leftovers if v.strip()])
    return record


def parse_txt_file(path: Path) -> List[Dict[str, str]]:
    try:
        raw = path.read_text(encoding="utf-8", errors="ignore")
    except UnicodeDecodeError:
        raw = path.read_text(encoding="latin-1", errors="ignore")

    lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
    if not lines:
        return []

    structured_records: List[Dict[str, str]] = []
    for line in lines:
        parsed = parse_structured_line(line)
        if parsed:
            structured_records.append(parsed)
    if structured_records:
        return structured_records

    return [parse_key_value_lines(lines)]


def collect_entries(source_dir: Path) -> List[Dict[str, str]]:
    entries: List[Dict[str, str]] = []
    for file_path in glob.glob(str(source_dir / "*.txt")):
        path_obj = Path(file_path)
        parsed_records = parse_txt_file(path_obj)
        mtime_dt = datetime.fromtimestamp(path_obj.stat().st_mtime)
        for rec in parsed_records:
            safe_record = {field: rec.get(field, "").strip() for field in EXPECTED_FIELDS}
            safe_record["archivo_origen"] = path_obj.name
            safe_record["fecha_dt"] = parse_date(safe_record.get("fecha"), mtime_dt)
            if not safe_record.get("fecha"):
                safe_record["fecha"] = safe_record["fecha_dt"].strftime("%Y-%m-%d")
            if not safe_record.get("cliente"):
                safe_record["cliente"] = "SIN_CLIENTE"
            entries.append(safe_record)
    return entries


def period_from_date(date_obj: datetime) -> str:
    return date_obj.strftime("%Y-%m")


def build_metrics(entries: List[Dict[str, str]]) -> MetricResponse:
    clientes: Dict[str, int] = defaultdict(int)
    estados: Dict[str, int] = defaultdict(int)
    periodos: Dict[str, int] = defaultdict(int)
    for e in entries:
        clientes[e.get("cliente", "SIN_CLIENTE")]+=1
        estados[e.get("estado", "") or "Sin estado"]+=1
        periodos[period_from_date(e.get("fecha_dt", datetime.utcnow()))]+=1
    return MetricResponse(
        total_registros=len(entries),
        clientes=dict(clientes),
        estados=dict(estados),
        periodos=dict(periodos),
    )


def write_excel_fixed(rows: List[Dict[str, str]]) -> Path:
    output_dir = BITACORA_OUTPUT_DIR
    output_dir.mkdir(parents=True, exist_ok=True)
    full_path = output_dir / BITACORA_FIXED_NAME

    wb = Workbook()
    ws = wb.active
    ws.title = "Bitacora"

    headers = [
        "Fecha",
        "Cliente",
        "Tecnico",
        "Tarea",
        "Estado",
        "Observaciones",
        "Archivo origen",
    ]
    ws.append(headers)

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="345995", end_color="345995", fill_type="solid")
    center = Alignment(vertical="center")
    for col, title in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col, value=title)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center

    zebra_fill = PatternFill(start_color="F8FBFF", end_color="F8FBFF", fill_type="solid")

    for idx, row in enumerate(rows, start=2):
        ws.append([
            row.get("fecha"),
            row.get("cliente"),
            row.get("tecnico"),
            row.get("tarea"),
            row.get("estado"),
            row.get("observaciones"),
            row.get("archivo_origen"),
        ])
        if idx % 2 == 0:
            for col in range(1, len(headers)+1):
                ws.cell(row=idx, column=col).fill = zebra_fill

    for col in range(1, len(headers)+1):
        ws.column_dimensions[ws.cell(row=1, column=col).column_letter].width = 22

    wb.save(full_path)
    return full_path


app = FastAPI(title="Bitacoras Mantenimiento", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"]
)


@app.get("/health")
def health():
    return {"status": "ok", "source": str(BITACORA_SOURCE_DIR), "output": str(BITACORA_OUTPUT_DIR)}


@app.post("/bitacora/procesar")
def procesar(req: ProcessRequest):
    if not BITACORA_SOURCE_DIR.exists():
        raise HTTPException(status_code=400, detail="Directorio de bitacoras no existe")

    entries = collect_entries(BITACORA_SOURCE_DIR)
    if not entries:
        return {"success": True, "message": "No hay nuevos registros", "generated": []}

    # Filtros opcionales (compatibilidad futura)
    if req.cliente:
        entries = [e for e in entries if e.get("cliente", "").lower() == req.cliente.lower()]
    if req.period:
        entries = [e for e in entries if period_from_date(e.get("fecha_dt", datetime.utcnow())) == req.period]

    if not entries:
        return {"success": True, "message": "No hay registros que cumplan el filtro", "generated": []}

    excel_path = write_excel_fixed(entries)
    metrics = build_metrics(entries)

    return {
        "success": True,
        "generated": [{
            "cliente": req.cliente or BITACORA_DEFAULT_CLIENTE,
            "periodo": req.period or "actual",
            "rows": len(entries),
            "path": str(excel_path),
            "filename": excel_path.name,
        }],
        "metrics": metrics.dict(),
        "processed_at": datetime.utcnow().isoformat(),
        "request_id": str(uuid.uuid4()),
        "message": "Bitácora actualizada correctamente",
    }


@app.get("/bitacora/metricas", response_model=MetricResponse)
def metricas():
    entries = collect_entries(BITACORA_SOURCE_DIR)
    return build_metrics(entries)


@app.get("/bitacora/excel")
def descargar():
    target = BITACORA_OUTPUT_DIR / BITACORA_FIXED_NAME
    if not target.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado. Procese la bitácora primero.")
    return FileResponse(
        path=target,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=target.name,
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"error": "internal_error", "detail": str(exc)[:200]})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("BITACORA_SERVICE_PORT", 8001)),
        reload=False
    )
