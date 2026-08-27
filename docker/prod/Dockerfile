# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

ENV CI=true \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# Copiar proyecto
COPY ./app /app

# Activar la version de pnpm declarada en package.json -> packageManager.
# Antes esto era `npm install -g pnpm` sin pinear, que con el tiempo empezo a
# resolver a pnpm 11 y rompia el build contra un lockfile v9. Ahora Dockerfile
# y CI toman la version del mismo lugar y no pueden divergir.
RUN corepack enable && corepack prepare --activate

# Instalar dependencias y construir
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Stage 2: Production
FROM nginx:stable-alpine

# Copiar config de nginx
COPY docker/prod/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build final
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

# Ejecutar nginx
CMD ["nginx", "-g", "daemon off;"]