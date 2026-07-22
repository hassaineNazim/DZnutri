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
# BACKEND_HOST : hôte:port du backend pour le reverse-proxy (nginx.conf.template).
# Défaut = nom du service dans docker-compose local ; à surcharger en prod
# (ex: Railway) avec l'hôte réseau privé du service backend.
ENV BACKEND_HOST=backend:8000
# Fichier *.template dans /etc/nginx/templates/ : l'image nginx officielle le
# passe par envsubst vers /etc/nginx/conf.d/ au démarrage du conteneur.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
