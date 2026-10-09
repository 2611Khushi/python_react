# Fieldnotes

A small full-stack learning project for practicing UI and web API CRUD. The topic is a personal reading log: add books, browse and filter them, update reading progress, and remove titles.

## Projects

- `backend/` is the Python FastAPI service. It validates requests and stores books in SQLite with SQLAlchemy.
- `frontend/` is an independent React + TypeScript app built with Vite. It calls the backend using `fetch` from `frontend/src/api.ts`.

They are separate projects and run in separate terminals. Start the API first, then the UI.

## Start the backend

In a PowerShell terminal:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API starts at `http://127.0.0.1:8000`. Visit `http://127.0.0.1:8000/docs` to try requests interactively. It creates `backend/fieldnotes.db` and adds sample books on first launch.

## Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`). By default the UI expects the API at `http://127.0.0.1:8000/api`. To point it elsewhere, create `frontend/.env.local` with `VITE_API_URL=http://your-api-host/api`.

## CRUD map

- Create: `POST /api/books` from the Add a book form
- Read: `GET /api/books` for the shelf, with optional `q` and `status` query parameters
- Update: `PUT /api/books/{id}` from the edit action
- Delete: `DELETE /api/books/{id}` from the remove action
- Health: `GET /api/health`

The OpenAPI docs show request and response shapes. Backend tests are in `backend/tests`; run them from that folder with `pytest -q`. Build-check the UI from `frontend` with `npm run build`.
