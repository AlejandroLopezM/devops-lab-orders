# devops-lab-orders

Aplicación web de gestión de pedidos desarrollada en Node.js + Express, diseñada como proyecto base para el **Laboratorio Técnico — Unidad 2: Flujos de entrega eficientes CI/CD y automatización** (Universidad de La Sabana).

---

## Descripción del proyecto

API REST con 4 endpoints para gestión de pedidos, pruebas unitarias con Jest y cobertura mínima del 70%, configurada con un pipeline CI/CD completo usando **GitHub Actions** (integración continua) y **Jenkins** (entrega continua).

---

## Estructura del repositorio

```
devops-lab-orders/
├── .github/
│   └── workflows/
│       └── ci.yml          ← Pipeline CI (GitHub Actions)
├── src/
│   └── app.js              ← Lógica de la aplicación (Express)
├── tests/
│   └── app.test.js         ← Pruebas unitarias (Jest)
├── index.js                ← Punto de entrada del servidor
├── package.json            ← Dependencias y scripts
├── Dockerfile              ← Imagen Docker multistage
├── Jenkinsfile             ← Pipeline CD (Jenkins)
└── README.md               ← Este archivo
```

---

## Endpoints disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check del servicio |
| GET | `/api/orders` | Listar todos los pedidos |
| GET | `/api/orders/:id` | Obtener pedido por ID |
| POST | `/api/orders` | Crear nuevo pedido |

---

## Flujo CI/CD

### Pipeline CI — GitHub Actions (`.github/workflows/ci.yml`)

Se dispara automáticamente ante cada **push** o **pull request** a la rama `main`.

```
push/PR a main
      │
      ▼
Stage 1 → Checkout código fuente
Stage 2 → Configurar Node.js 18
Stage 3 → Instalar dependencias (npm ci)
Stage 4 → Ejecutar pruebas unitarias (Jest + cobertura)
Stage 5 → Publicar reporte de cobertura como artefacto
Stage 6 → Análisis estático de código
Stage 7 → Construir imagen Docker
Stage 8 → Escaneo de seguridad (Trivy)
Stage 9 → Login en GitHub Container Registry
Stage 10 → Publicar imagen en ghcr.io
Stage 11 → Resumen del pipeline
```

### Pipeline CD — Jenkins (`Jenkinsfile`)

Se ejecuta manualmente o desde un webhook configurado en Jenkins.

```
Stage 1  → Clonar repositorio
Stage 2  → Instalar dependencias
Stage 3  → Ejecutar pruebas + reporte de cobertura
Stage 4  → Construir imagen Docker
Stage 5  → Escaneo de seguridad (Trivy)
Stage 6  → Publicar imagen en ghcr.io
Stage 7  → Despliegue en Staging (Kubernetes)
Stage 8  → Pruebas de integración en Staging
Stage 9  → Aprobación manual (para producción)
Stage 10 → Despliegue en Producción (Kubernetes)
Stage 11 → Health check post-despliegue
```

---

## Ejecución local

### Requisitos
- Node.js >= 18
- Docker

### Instalar y ejecutar

```bash
# Clonar el repositorio
git clone https://github.com/AlejandroLopezM/devops-lab-orders.git
cd devops-lab-orders

# Instalar dependencias
npm install

# Ejecutar pruebas
npm test

# Iniciar la aplicación
npm start
# → Servidor en http://localhost:3000
```

### Con Docker

```bash
# Construir imagen
docker build -t devops-lab-orders:latest .

# Ejecutar contenedor
docker run -p 3000:3000 devops-lab-orders:latest

# Verificar health check
curl http://localhost:3000/health
```

---

## Herramientas utilizadas

| Herramienta | Rol en el pipeline |
|-------------|-------------------|
| GitHub | Repositorio y control de versiones |
| GitHub Actions | Pipeline CI automático |
| Jest + Supertest | Pruebas unitarias e integración |
| Docker | Contenerización de la aplicación |
| Trivy | Escaneo de vulnerabilidades en imagen |
| ghcr.io | Registry de imágenes Docker |
| Jenkins | Pipeline CD hacia Kubernetes |
| Kubernetes | Orquestación de contenedores |

---

## Autor

**Alejandro López** — Universidad de La Sabana  
Curso: EFEFIC-FDVP20263 — Unidad 2
