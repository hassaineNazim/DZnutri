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
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
