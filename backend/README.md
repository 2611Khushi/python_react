# Fieldnotes API (backend)

FastAPI owns validation and persistence; this project is independent from the React frontend.

## Run

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is at `http://127.0.0.1:8000`; interactive docs are at `/docs`. SQLite creates `fieldnotes.db` here and inserts three sample books on first start. Set `DATABASE_URL` to use another SQLAlchemy database URL.

## Endpoints

- `GET /api/books?q=&status=` lists and filters books
- `POST /api/books` creates a book
- `PUT /api/books/{id}` replaces a book's editable fields
- `DELETE /api/books/{id}` removes a book
- `GET /api/health` checks API availability

Run tests with `pytest` from this directory.
