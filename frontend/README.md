# Fieldnotes UI (frontend)

React + TypeScript reading journal. This is a standalone Vite project; its API calls live in `src/api.ts`, while the FastAPI service runs separately from `../backend`.

## Run

```powershell
npm install
npm run dev
```

The app expects `http://127.0.0.1:8000/api` by default. Override with `VITE_API_URL` in `.env.local`. Build with `npm run build`.
