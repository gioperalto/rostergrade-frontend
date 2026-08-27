# RosterGrade frontend

Standalone Vite + React + TypeScript frontend for RosterGrade. The API lives in the separate [`rostergrade`](https://github.com/gioperalto/rostergrade) repository.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` to the URL of the running API. Vite defaults to `http://localhost:8000` during development when the variable is omitted.

## Railway deployment

Create a Railway service from this repository and use the included Dockerfile. Set this build variable/environment variable:

```text
VITE_API_URL=https://<your-rostergrade-api-domain>
```

`VITE_API_URL` is embedded into the static frontend at build time. After the frontend has a public domain, add that exact origin (for example `https://rostergrade-frontend.up.railway.app`) to the API service's `CORS_ORIGINS` variable. Multiple origins may be separated by commas.

The frontend container serves the Vite production build with Nginx and exposes `/health` for Railway health checks. Client-side routes fall back to `index.html`.
