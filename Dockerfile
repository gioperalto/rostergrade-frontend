FROM nginx:alpine

COPY index.html styles.css app.js /usr/share/nginx/html/
COPY config.js.template /etc/nginx/templates/config.js.template
COPY 40-config.sh /docker-entrypoint.d/40-config.sh
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080
