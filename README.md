# devops-lab-orders — Unidad 3

Pipeline CI/CD completo con seguridad y monitoreo integrados.

**Curso:** EFEFIC-FDVP20263 — Unidad 3  
**Autor:** Alejandro López Castañeda — AlejandroLopezM

---

## Stack tecnológico

| Capa | Herramienta | Propósito |
|------|-------------|-----------|
| CI | GitHub Actions | Pipeline de integración continua (14 stages) |
| CD | Jenkins | Pipeline de entrega continua (13 stages) |
| Seguridad | Snyk | Escaneo de vulnerabilidades en dependencias |
| Seguridad | Trivy | Escaneo de vulnerabilidades en imagen Docker |
| Seguridad | SonarQube | Análisis estático de código |
| Monitoreo | Prometheus | Recolección de métricas |
| Monitoreo | Grafana | Visualización de dashboards |
| Orquestación | Kubernetes | Despliegue en staging y producción |
| Registry | ghcr.io | Almacenamiento de imágenes Docker |

---

## Estructura del repositorio

```
devops-lab-orders/
├── .github/workflows/
│   └── ci.yml              ← Pipeline CI (14 stages)
├── src/
│   └── app.js              ← API REST Node.js + Express
├── tests/
│   └── app.test.js         ← 12 pruebas unitarias Jest
├── k8s/
│   └── deployment.yml      ← Manifests Kubernetes
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml  ← Configuración Prometheus
│   └── grafana/
│       └── provisioning/   ← Datasources Grafana
├── docker-compose.yml      ← Stack completo local
├── Dockerfile              ← Imagen multistage Node 18 Alpine
├── Jenkinsfile             ← Pipeline CD (13 stages)
└── README.md
```

---

## Pipeline CI — GitHub Actions (14 stages)

```
git push → main
    ↓
Stage 1  → Checkout código
Stage 2  → Setup Node.js 18
Stage 3  → npm ci
Stage 4  → Jest 12/12 tests ✅
Stage 5  → Coverage report artifact
Stage 6  → Análisis estático
Stage 7  → Snyk scan (vulnerabilidades dependencias) 🛡️
Stage 8  → Publicar reporte Snyk
Stage 9  → Setup Docker Buildx (caché)
Stage 10 → Docker build (con caché de capas) ⚡
Stage 11 → Trivy scan (vulnerabilidades imagen) 🔒
Stage 12 → Login ghcr.io
Stage 13 → Push imagen ghcr.io
Stage 14 → Resumen del pipeline
```

---

## Pipeline CD — Jenkins (13 stages)

```
Stage 1  → Clone repository
Stage 2  → Install dependencies
Stage 3  → Run tests + coverage
Stage 4  → SonarQube analysis 🔍
Stage 5  → Snyk security scan 🛡️
Stage 6  → Docker build
Stage 7  → Trivy image scan 🔒
Stage 8  → Push to registry
Stage 9  → Deploy staging
Stage 10 → Integration tests
Stage 11 → Approval gate ⏸️
Stage 12 → Deploy production
Stage 13 → Post-deploy health check
```

---

## Levantar monitoreo local

```bash
docker-compose up -d
```

- **App:** http://localhost:3000
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001 (admin / devops2024)

---

## Resultados de seguridad (Snyk)

- **package.json:** 0 vulnerabilidades ✅
- **Dockerfile (node:18-alpine):** 44 vulnerabilidades detectadas
  - 2 críticas, 13 altas, 8 medias, 21 bajas
  - Recomendación: actualizar a `node:26.3.0-alpine` → 0 vulnerabilidades

---

## Mejoras aplicadas (feedback U2)

La profe sugirió implementar caché de capas Docker. Se implementó en el Stage 9-10 usando `docker/build-push-action` con `cache-from: type=gha` y `cache-to: type=gha,mode=max`, reduciendo tiempos de build en builds posteriores.
