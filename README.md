# RosterGrade frontend

A lightweight production frontend for the RosterGrade API. It is intentionally framework-free for this milestone: Nginx serves the static UI and reverse-proxies API requests so browser authentication remains same-origin.

## Local development

Serve this directory with any static server for UI-only work, or use the production container (which proxies to the API):

```bash
docker build -t rostergrade-frontend:local .
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e API_BASE_URL=http://localhost:8000 \
  rostergrade-frontend:local
```

Open <http://localhost:8080>. The API must allow `http://localhost:8080` through `FRONTEND_ORIGINS`.

## Railway

Create a service from `gioperalto/rostergrade-frontend` on the `main` branch. Railway will detect the root `Dockerfile`.

Set this variable on the frontend service as the private Nginx upstream. It is not exposed to browser JavaScript:

```text
API_BASE_URL=https://YOUR-API-DOMAIN.up.railway.app
```

The API service must set:

```text
FRONTEND_ORIGINS=https://YOUR-FRONTEND-DOMAIN.up.railway.app
```

Generate a public domain for the frontend service after its first successful deployment. Add that exact origin to the API variable, then redeploy the API. The browser should call `/auth/*`, `/api/*`, `/leagues/*`, and `/health` on the frontend origin; it should not call the API domain directly.
