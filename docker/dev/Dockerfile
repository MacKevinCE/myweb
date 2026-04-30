FROM node:22-alpine

RUN apk add --no-cache git openssh bash

# Instala PNPM global (más rápido para Astro)
RUN npm install -g pnpm

WORKDIR /app

# Mantener node_modules dentro del contenedor
VOLUME ["/app/node_modules"]

CMD ["sh", "-c", "pnpm install && pnpm dev --host"]