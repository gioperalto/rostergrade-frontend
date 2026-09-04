# RosterGrade frontend

A lightweight production frontend for the RosterGrade API. It is intentionally framework-free for this milestone: Nginx serves the static UI and injects the API URL at container startup.

## Local development

Serve this directory with any static server and set the API URL in the browser before loading, or use the production container:

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

Set this variable on the frontend service:

```text
API_BASE_URL=https://YOUR-API-DOMAIN.up.railway.app
```

The API service must set:

```text
FRONTEND_ORIGINS=https://YOUR-FRONTEND-DOMAIN.up.railway.app
```

Generate a public domain for the frontend service after its first successful deployment. Add that exact origin to the API variable, then redeploy the API.
