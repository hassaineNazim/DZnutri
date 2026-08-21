# ---- Build de l'admin React, servi par nginx (production) ----
FROM node:20-alpine AS build
WORKDIR /app

# Dépendances (couche cachée tant que package*.json ne change pas)
COPY package*.json ./
RUN npm ci || npm install

COPY . .

# baseURL relative : nginx (ci-dessous) proxifie /api, /auth, /health vers le backend.
# (chaîne "/" => truthy, contrairement à "" qui serait ignoré par le code.)
ARG REACT_APP_API_URL=/
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV CI=false
RUN npm run build

# ---- Image finale nginx ----
FROM nginx:alpine
# URL complète du backend pour le reverse-proxy. Le domaine public Railway est
# utilisé par défaut : le réseau privé résout le service mais n'ouvre pas son
# port de façon fiable (502/504 observés en production).
ENV BACKEND_URL=https://dznutri-backend-production.up.railway.app
# Fichier *.template dans /etc/nginx/templates/ : l'image nginx officielle le
# passe par envsubst vers /etc/nginx/conf.d/ au démarrage du conteneur.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
