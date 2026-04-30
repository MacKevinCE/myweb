# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar PNPM
RUN npm install -g pnpm

ENV CI=true

# Copiar proyecto
COPY ./app /app

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