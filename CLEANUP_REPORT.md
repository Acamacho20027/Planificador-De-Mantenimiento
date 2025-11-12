Summary of code & visual cleanup performed

What I changed (applied now):
- Added `Styles/design-tokens.css` with:
  - Inter font import
  - Central color tokens (Canva palette)
  - Typography scale and base sizes
  - Button system (primary/secondary/ghost)
  - Accessible focus outlines and utility classes
- Injected `design-tokens.css` into all views in `Vistas/*.html` so the tokens and typography are applied consistently.
- Accessibility and form fixes:
  - Added `name` attributes to input elements where missing in `Vistas/login.html`, `Vistas/reset.html`, `Vistas/index.html`, `Vistas/dashboard.html`, `Vistas/inspeccion.html`.
  - Linked `<label for="...">` for multiple inputs in the contact and admin forms.
  - Replaced the inline user-login form (in `usuario.js`) to redirect to canonical `Vistas/login.html`.
- Visual fixes:
  - Ensured the injected admin logout button has visible styling via `Styles/custom-dashboard.css`.
- Minor behavior:
  - Logout now redirects to `/Vistas/login.html` for a clear UX.

Files I intentionally did NOT modify (but recommended):
- `Styles/styles.css` and `Styles/canva-index.css` still exist. They contain overlapping :root tokens and legacy rules. Instead of in-place merging (risky), I added `design-tokens.css` which overrides values when loaded after them. The next step is to merge and remove duplicates.

Recommended cleanup actions (next steps):
1) Remove `.venv` from repository and add a `.gitignore` entry for it. The repository currently contains a `.venv` folder used for Python dependencies; this should not be checked in.
2) Consolidate `:root` tokens:
   - Move all tokens into `Styles/design-tokens.css` (already started). Then remove the duplicate `:root` blocks from `Styles/styles.css` and `Styles/canva-index.css` to avoid confusion.
3) Consolidate CSS files and ordering:
   - Decide canonical base CSS (e.g., `styles.css`) + component CSS (e.g., `custom-dashboard.css`). Import `design-tokens.css` first, then the base and component CSS.
4) Run a small linting step and visual regression to catch overwritten rules.
5) Replace raster UI icons with SVG icons (Heroicons/FontAwesome) to improve crispness and file size.
6) Create a small `Styles/_README.md` describing tokens and how to extend styles safely.

Notes about DB and behaviour:
- I validated the debug endpoint and CSRF flows earlier; cookies are being set and the `pm.sid` session cookie exists. If you still have login/CSRF issues, we should run one focused test and capture `GET /auth/csrf` + `POST /auth/login` network traces.

If you want, I can proceed to:
- Merge and remove duplicate :root blocks in `styles.css` and `canva-index.css` (I will create a backup first).
- Add a `.gitignore` that excludes `.venv` and common build artifacts.
- Add a small README and run a quick lint to surface leftover JS duplicate declarations.

Tell me which of these next steps you want me to execute automatically and I will proceed.