#!/bin/sh
set -eu
: "${API_BASE_URL:=http://localhost:8000}"
envsubst '${API_BASE_URL}' < /etc/nginx/templates/config.js.template > /usr/share/nginx/html/config.js
