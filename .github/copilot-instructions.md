# Fieldnotes workspace notes

- Keep `backend/` (FastAPI, SQLAlchemy, SQLite) and `frontend/` (React, TypeScript, Vite) as independent projects.
- The UI calls the API through `frontend/src/api.ts`; preserve the endpoint contract documented in the root README.
- Backend setup and tests are documented in `backend/README.md`; frontend setup and build are documented in `frontend/README.md`.
