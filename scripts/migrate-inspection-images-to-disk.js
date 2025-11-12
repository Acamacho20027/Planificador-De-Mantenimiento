/*
 Migration script: move inspection images stored as base64 in `imagenes_inspeccion.data_base64`
 to disk under UPLOAD_DIR/inspections/<id_inspeccion>/ and set url_path on the table.

 Usage:
   node scripts/migrate-inspection-images-to-disk.js

 Configure via .env or environment variables:
   UPLOAD_DIR (default: ./uploads)

 The script will:
 - Connect to DB using config/database.js
 - Ensure `imagenes_inspeccion` has a `url_path` NVARCHAR(500) column (ALTER TABLE if missing)
 - For each row with non-empty data_base64, decode and write file to disk, then UPDATE url_path and NULL data_base64
 - Log progress and errors.
*/

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db = require('../config/database');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

async function ensureUrlPathColumn(pool) {
  const check = await pool.request()
    .query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'imagenes_inspeccion' AND COLUMN_NAME = 'url_path'`);
  if (!check.recordset || check.recordset.length === 0) {
    console.log('Adding url_path column to imagenes_inspeccion...');
    await pool.request().query(`ALTER TABLE imagenes_inspeccion ADD url_path NVARCHAR(500) NULL`);
  } else {
    console.log('url_path column already exists.');
  }
}

async function migrate() {
  const pool = await db.getConnection();
  await ensureUrlPathColumn(pool);

  // parse CLI args
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetDirArgIndex = args.indexOf('--target-dir');
  const targetDir = (targetDirArgIndex !== -1 && args[targetDirArgIndex + 1]) ? args[targetDirArgIndex + 1] : UPLOAD_DIR;

  const res = await pool.request()
    .query(`SELECT id_imagen, id_inspeccion, nombre_archivo, tipo_mime, data_base64 FROM imagenes_inspeccion WHERE data_base64 IS NOT NULL AND LEN(data_base64) > 0`);

  const rows = res.recordset || [];
  console.log(`Found ${rows.length} images to migrate. dryRun=${dryRun} targetDir=${targetDir}`);

  for (const row of rows) {
    try {
      const id = row.id_imagen;
      const id_inspeccion = row.id_inspeccion || 'unknown';
      let filename = row.nombre_archivo || `imagen-${id}.bin`;
      // sanitize filename
      filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

      let base64 = row.data_base64 || '';
      const match = /^data:(.+);base64,(.+)$/.exec(base64);
      if (match) base64 = match[2];

      const buffer = Buffer.from(base64, 'base64');

      const dir = path.join(targetDir, 'inspections', String(id_inspeccion));
      const outPath = path.join(dir, `${Date.now()}-${filename}`);

      if (dryRun) {
        console.log(`Dry-run: would write ${outPath} (${buffer.length} bytes) and update DB row ${id}`);
        continue;
      }

      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(outPath, buffer);

      const urlPath = `/uploads/inspections/${id_inspeccion}/${path.basename(outPath)}`;

      // update DB: set url_path and null data_base64 and set tamaño_bytes if column exists
      const updateReq = pool.request();
      updateReq.input('id_imagen', id);
      updateReq.input('url_path', urlPath);
      updateReq.input('tamanobytes', buffer.length);

      // Some schemas may not have tamaño_bytes column; use try/catch
      try {
        // Some schemas disallow NULL on data_base64. To be safe, set it to empty string instead of NULL
        // which frees the large column's content while avoiding schema changes.
        await updateReq.query(`UPDATE imagenes_inspeccion SET url_path = @url_path, data_base64 = '', tamaño_bytes = @tamanobytes WHERE id_imagen = @id_imagen`);
      } catch (e) {
        // try without tamaño_bytes
        await updateReq.query(`UPDATE imagenes_inspeccion SET url_path = @url_path, data_base64 = '' WHERE id_imagen = @id_imagen`);
      }

      console.log(`Migrated image id=${id} -> ${outPath}`);
    } catch (err) {
      console.error('Failed to migrate row', row && row.id_imagen, err && err.message);
    }
  }

  console.log('Migration complete.');
  process.exit(0);
}

migrate().catch(err => { console.error('Migration failed:', err); process.exit(1); });
