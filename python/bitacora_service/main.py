"""
Microservicio FastAPI que delega toda la lógica de bitácoras al processor (bitacorasmym original).
"""
import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

import processor

BASE_DIR = Path(__file__).resolve().parent
BITACORA_SOURCE_DIR = BASE_DIR / "bitacoras"
BITACORA_OUTPUT_DIR = BASE_DIR / "output"
BITACORA_DEFAULT_CLIENTE = os.getenv("BITACORA_DEFAULT_CLIENTE", "Cliente Principal")
CLIENTS_FILE = BITACORA_OUTPUT_DIR / "clientes.json"

BITACORA_SOURCE_DIR.mkdir(parents=True, exist_ok=True)
BITACORA_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def load_clients() -> List[str]:
    if not CLIENTS_FILE.exists():
        save_clients([BITACORA_DEFAULT_CLIENTE])
        return [BITACORA_DEFAULT_CLIENTE]
    try:
        data = json.loads(CLIENTS_FILE.read_text(encoding="utf-8") or "[]")
        if not isinstance(data, list):
            raise ValueError("invalid format")
        clean = [str(item).strip() for item in data if str(item).strip()]
    except Exception:
        clean = [BITACORA_DEFAULT_CLIENTE]
    if BITACORA_DEFAULT_CLIENTE not in clean:
        clean.append(BITACORA_DEFAULT_CLIENTE)
        save_clients(clean)
    return clean


def save_clients(items: List[str]) -> None:
    unique = []
    seen = set()
    for item in items:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    CLIENTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    CLIENTS_FILE.write_text(json.dumps(unique, ensure_ascii=False, indent=2), encoding="utf-8")


class ProcessRequest(BaseModel):
    cliente: Optional[str] = None
    period: Optional[str] = None


class ClientCreate(BaseModel):
    nombre: str


class MetricResponse(BaseModel):
    total_registros: int
    clientes: Dict[str, int]
    estados: Dict[str, int]
    periodos: Dict[str, int]


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", value or "sin_cliente")
    return cleaned.strip("_") or "sin_cliente"


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
def procesar(req: ProcessRequest | None = Body(default=None)):
    target_cliente = ((req.cliente if req else None) or BITACORA_DEFAULT_CLIENTE).strip() or BITACORA_DEFAULT_CLIENTE
    period = (req.period if req else None) or None
    try:
        result = processor.procesar_bitacora(
            cliente=target_cliente,
            period=period,
            source_dir=BITACORA_SOURCE_DIR,
            output_dir=BITACORA_OUTPUT_DIR,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    new_added = result.get("new_records_added", result.get("rows", 0))
    total = result.get("total_rows", 0)

    if not result.get("path") or new_added == 0:
        return {
            "success": True,
            "status": "ok",
            "message": "No hay nuevos registros para procesar" if total == 0 else f"Excel actualizado. {total} registros totales (sin registros nuevos este mes).",
            "generated": [],
            "lines_read": result.get("lines_read", 0),
            "lines_valid": result.get("lines_valid", 0),
            "file_stats": result.get("file_stats", []),
            "new_records": 0,
            "total_rows": total,
        }

    return {
        "success": True,
        "generated": [{
            "cliente": target_cliente,
            "periodo": result.get("year"),
            "rows": result.get("rows", 0),
            "new_records_added": new_added,
            "total_rows": total,
            "path": str(result.get("path")),
            "filename": result.get("filename"),
        }],
        "metrics": {},
        "processed_at": datetime.utcnow().isoformat(),
        "request_id": None,
        "message": f"Bitácora actualizada. {new_added} registro(s) nuevo(s) agregado(s). Total: {total}.",
        "lines_read": result.get("lines_read", 0),
        "lines_valid": result.get("lines_valid", 0),
        "file_stats": result.get("file_stats", []),
        "new_records": new_added,
        "total_rows": total,
        "status": "ok",
    }


@app.get("/bitacora/metricas")
def metricas():
    total = 0
    clientes: Dict[str, int] = {}
    estados: Dict[str, int] = {}
    periodos: Dict[str, int] = {}

    if not BITACORA_OUTPUT_DIR.exists():
        return {"total_registros": 0, "clientes": {}, "estados": {}, "periodos": {}}

    for xlsx_path in BITACORA_OUTPUT_DIR.glob("bitacora_*.xlsx"):
        try:
            df = pd.read_excel(xlsx_path, engine="openpyxl")
        except Exception:
            continue
        if df.empty:
            continue
        rows = len(df)
        total += rows
        try:
            name_part = xlsx_path.stem.split("bitacora_", 1)[1]
            cliente_part = name_part.rsplit("_", 1)[0]
        except Exception:
            cliente_part = "SIN_CLIENTE"
        clientes[cliente_part] = clientes.get(cliente_part, 0) + rows
        estados_col = df.get("Estado")
        if estados_col is not None:
            for val in estados_col.fillna("").astype(str):
                v = str(val).strip()
                if v:
                    estados[v] = estados.get(v, 0) + 1
        if "Fecha Solicitud" in df.columns:
            for val in pd.to_datetime(df["Fecha Solicitud"], errors="coerce"):
                if pd.isna(val):
                    continue
                try:
                    key = f"{int(val.year)}-{int(val.month):02d}"
                    periodos[key] = periodos.get(key, 0) + 1
                except (ValueError, TypeError):
                    pass

    return {"total_registros": total, "clientes": clientes, "estados": estados, "periodos": periodos}


@app.get("/bitacora/clientes")
def listar_clientes():
    clientes = load_clients()
    return {"clientes": clientes, "default": BITACORA_DEFAULT_CLIENTE}


@app.post("/bitacora/clientes")
def crear_cliente(body: ClientCreate):
    nombre = (body.nombre or "").strip()
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre de cliente es obligatorio")

    clientes = load_clients()
    nombres_lc = [c.lower() for c in clientes]
    if nombre.lower() in nombres_lc:
        return {"success": False, "message": "El cliente ya existe", "clientes": clientes, "created": False}

    clientes.append(nombre)
    save_clients(clientes)
    return {"success": True, "message": "Cliente creado correctamente", "clientes": sorted(clientes, key=str.lower), "created": True}


@app.get("/bitacora/excel")
def descargar(cliente: Optional[str] = None, period: Optional[str] = None):
    target_cliente = (cliente or BITACORA_DEFAULT_CLIENTE).strip() or BITACORA_DEFAULT_CLIENTE
    safe_cliente = slugify(target_cliente).lower()
    try:
        target_year = int(period.split("-")[0]) if period else datetime.utcnow().year
    except Exception:
        target_year = datetime.utcnow().year

    chosen_path = BITACORA_OUTPUT_DIR / f"bitacora_{safe_cliente}_{target_year}.xlsx"

    if not chosen_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado. Procese la bitácora primero.")

    return FileResponse(
        path=chosen_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=chosen_path.name,
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"error": "internal_error", "detail": str(exc)[:200]})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=False
    )
