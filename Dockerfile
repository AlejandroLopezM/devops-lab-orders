# ── Stage 1: build e instalación de dependencias ──────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar manifiestos primero para aprovechar el cache de capas
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# ── Stage 2: imagen final mínima ───────────────────────────────────────────────
FROM node:18-alpine

# Metadatos de la imagen
LABEL maintainer="AlejandroLopezM"
LABEL description="Orders management service - DevOps Lab U2"
LABEL version="1.0.0"

WORKDIR /app

# Copiar dependencias del stage anterior
COPY --from=builder /app/node_modules ./node_modules

# Copiar código fuente
COPY index.js ./
COPY src/ ./src/

# Variable de entorno para el puerto
ENV PORT=3000
ENV NODE_ENV=production

# Exponer el puerto de la aplicación
EXPOSE 3000

# Usuario no-root para seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Health check del contenedor
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Comando de inicio
CMD ["node", "index.js"]
