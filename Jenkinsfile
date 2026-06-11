// ══════════════════════════════════════════════════════════════════════════════
// JENKINSFILE — Pipeline CD (Entrega Continua)
// Proyecto  : devops-lab-orders
// Autor     : AlejandroLopezM
// Repositorio: https://github.com/AlejandroLopezM/devops-lab-orders
// ══════════════════════════════════════════════════════════════════════════════

pipeline {

    // ── Agente: cualquier nodo disponible ─────────────────────────────────────
    agent any

    // ── Variables de entorno globales ─────────────────────────────────────────
    environment {
        // Datos del repositorio
        REPO_URL        = 'https://github.com/AlejandroLopezM/devops-lab-orders.git'
        BRANCH          = 'main'

        // Datos de la imagen Docker
        REGISTRY        = 'ghcr.io'
        IMAGE_NAME      = 'ghcr.io/alejandrolopezm/devops-lab-orders'
        IMAGE_TAG       = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'local'}"

        // Credenciales (configuradas en Jenkins > Manage Credentials)
        REGISTRY_CREDS  = credentials('ghcr-credentials')

        // Kubernetes
        K8S_NAMESPACE_STAGING = 'staging'
        K8S_NAMESPACE_PROD    = 'production'
        K8S_DEPLOYMENT        = 'orders-service'

        // Notificaciones
        SLACK_CHANNEL   = '#devops-notifications'
    }

    // ── Opciones del pipeline ─────────────────────────────────────────────────
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        ansiColor('xterm')
    }

    // ── Parámetros configurables ──────────────────────────────────────────────
    parameters {
        choice(
            name: 'DEPLOY_ENV',
            choices: ['staging', 'production'],
            description: 'Ambiente de despliegue objetivo'
        )
        booleanParam(
            name: 'SKIP_STAGING',
            defaultValue: false,
            description: 'Saltar despliegue en staging (solo para hotfixes)'
        )
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGES DEL PIPELINE
    // ══════════════════════════════════════════════════════════════════════════
    stages {

        // ── STAGE 1: Clonar repositorio ───────────────────────────────────────
        stage('Clone Repository') {
            steps {
                echo '📥 Clonando repositorio desde GitHub...'
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "*/${env.BRANCH}"]],
                    userRemoteConfigs: [[
                        url: "${env.REPO_URL}",
                        credentialsId: 'github-credentials'
                    ]]
                ])
                echo "✅ Repositorio clonado - Commit: ${env.GIT_COMMIT}"
            }
        }

        // ── STAGE 2: Instalar dependencias ───────────────────────────────────
        stage('Install Dependencies') {
            steps {
                echo '📦 Instalando dependencias de Node.js...'
                sh '''
                    node --version
                    npm --version
                    npm ci
                    echo "✅ Dependencias instaladas"
                '''
            }
        }

        // ── STAGE 3: Ejecutar pruebas ─────────────────────────────────────────
        stage('Run Tests') {
            steps {
                echo '🧪 Ejecutando pruebas unitarias...'
                sh 'npm run test:ci'
            }
            post {
                always {
                    // Publicar reporte de cobertura en Jenkins
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }

        // ── STAGE 4: Construir imagen Docker ──────────────────────────────────
        stage('Build Docker Image') {
            steps {
                echo "🐳 Construyendo imagen Docker: ${env.IMAGE_NAME}:${env.IMAGE_TAG}"
                sh """
                    docker build \\
                        --tag ${env.IMAGE_NAME}:${env.IMAGE_TAG} \\
                        --tag ${env.IMAGE_NAME}:latest \\
                        --label "build=${env.BUILD_NUMBER}" \\
                        --label "commit=${env.GIT_COMMIT}" \\
                        .
                    echo "✅ Imagen construida exitosamente"
                    docker images ${env.IMAGE_NAME}
                """
            }
        }

        // ── STAGE 5: Escaneo de seguridad ─────────────────────────────────────
        stage('Security Scan') {
            steps {
                echo '🔒 Escaneando imagen por vulnerabilidades (Trivy)...'
                sh """
                    # Instalar Trivy si no está disponible
                    if ! command -v trivy &> /dev/null; then
                        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
                    fi

                    trivy image \\
                        --severity HIGH,CRITICAL \\
                        --exit-code 0 \\
                        --ignore-unfixed \\
                        --format table \\
                        ${env.IMAGE_NAME}:${env.IMAGE_TAG}

                    echo "✅ Escaneo de seguridad completado"
                """
            }
        }

        // ── STAGE 6: Publicar imagen en registry ──────────────────────────────
        stage('Push to Registry') {
            steps {
                echo "📤 Publicando imagen en ${env.REGISTRY}..."
                sh """
                    echo ${env.REGISTRY_CREDS_PSW} | docker login ${env.REGISTRY} \\
                        -u ${env.REGISTRY_CREDS_USR} --password-stdin

                    docker push ${env.IMAGE_NAME}:${env.IMAGE_TAG}
                    docker push ${env.IMAGE_NAME}:latest

                    echo "✅ Imagen publicada: ${env.IMAGE_NAME}:${env.IMAGE_TAG}"
                """
            }
        }

        // ── STAGE 7: Despliegue en Staging ────────────────────────────────────
        stage('Deploy to Staging') {
            when {
                expression { return !params.SKIP_STAGING }
            }
            steps {
                echo "🚀 Desplegando en namespace: ${env.K8S_NAMESPACE_STAGING}"
                sh """
                    # Actualizar imagen en el deployment de Kubernetes (staging)
                    kubectl set image deployment/${env.K8S_DEPLOYMENT} \\
                        orders=${env.IMAGE_NAME}:${env.IMAGE_TAG} \\
                        --namespace=${env.K8S_NAMESPACE_STAGING}

                    # Esperar que el rollout complete
                    kubectl rollout status deployment/${env.K8S_DEPLOYMENT} \\
                        --namespace=${env.K8S_NAMESPACE_STAGING} \\
                        --timeout=120s

                    echo "✅ Despliegue en staging exitoso"
                """
            }
        }

        // ── STAGE 8: Pruebas de integración en Staging ────────────────────────
        stage('Integration Tests (Staging)') {
            when {
                expression { return !params.SKIP_STAGING }
            }
            steps {
                echo '🔬 Ejecutando pruebas de integración en staging...'
                sh """
                    # Obtener URL del servicio en staging
                    STAGING_URL=\$(kubectl get svc ${env.K8S_DEPLOYMENT} \\
                        --namespace=${env.K8S_NAMESPACE_STAGING} \\
                        -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

                    # Health check del servicio desplegado
                    sleep 10
                    curl -f http://\${STAGING_URL}:3000/health || exit 1

                    # Verificar endpoint principal
                    curl -f http://\${STAGING_URL}:3000/api/orders || exit 1

                    echo "✅ Pruebas de integración en staging exitosas"
                """
            }
        }

        // ── STAGE 9: Aprobación manual antes de producción ────────────────────
        stage('Approval Gate') {
            when {
                expression { return params.DEPLOY_ENV == 'production' }
            }
            steps {
                echo '⏸️  Esperando aprobación para despliegue en PRODUCCIÓN...'
                timeout(time: 15, unit: 'MINUTES') {
                    input(
                        message: '¿Aprobar despliegue en producción?',
                        ok: 'Aprobar y desplegar',
                        submitter: 'devops-lead,tech-lead'
                    )
                }
                echo '✅ Despliegue aprobado'
            }
        }

        // ── STAGE 10: Despliegue en Producción ────────────────────────────────
        stage('Deploy to Production') {
            when {
                expression { return params.DEPLOY_ENV == 'production' }
            }
            steps {
                echo "🎯 Desplegando en PRODUCCIÓN - namespace: ${env.K8S_NAMESPACE_PROD}"
                sh """
                    # Despliegue canary: actualizar imagen en producción
                    kubectl set image deployment/${env.K8S_DEPLOYMENT} \\
                        orders=${env.IMAGE_NAME}:${env.IMAGE_TAG} \\
                        --namespace=${env.K8S_NAMESPACE_PROD}

                    # Esperar que el rollout complete
                    kubectl rollout status deployment/${env.K8S_DEPLOYMENT} \\
                        --namespace=${env.K8S_NAMESPACE_PROD} \\
                        --timeout=180s

                    echo "✅ Despliegue en producción exitoso"
                    echo "📌 Versión desplegada: ${env.IMAGE_TAG}"
                """
            }
        }

        // ── STAGE 11: Verificación post-despliegue ────────────────────────────
        stage('Post-Deploy Health Check') {
            when {
                expression { return params.DEPLOY_ENV == 'production' }
            }
            steps {
                echo '🏥 Verificando salud del servicio en producción...'
                sh """
                    PROD_URL=\$(kubectl get svc ${env.K8S_DEPLOYMENT} \\
                        --namespace=${env.K8S_NAMESPACE_PROD} \\
                        -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

                    sleep 15
                    curl -f http://\${PROD_URL}:3000/health || {
                        echo "❌ Health check falló - iniciando rollback..."
                        kubectl rollout undo deployment/${env.K8S_DEPLOYMENT} \\
                            --namespace=${env.K8S_NAMESPACE_PROD}
                        exit 1
                    }
                    echo "✅ Servicio en producción operativo"
                """
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST: acciones según resultado del pipeline
    // ══════════════════════════════════════════════════════════════════════════
    post {
        success {
            echo """
            ╔══════════════════════════════════════════╗
            ║   ✅  PIPELINE COMPLETADO EXITOSAMENTE   ║
            ╚══════════════════════════════════════════╝
            Build    : #${env.BUILD_NUMBER}
            Imagen   : ${env.IMAGE_NAME}:${env.IMAGE_TAG}
            Ambiente : ${params.DEPLOY_ENV}
            """
        }
        failure {
            echo """
            ╔══════════════════════════════════════════╗
            ║   ❌  PIPELINE FALLÓ                     ║
            ╚══════════════════════════════════════════╝
            Build #${env.BUILD_NUMBER} falló.
            Revisar logs en: ${env.BUILD_URL}
            """
        }
        always {
            // Limpiar imágenes locales para liberar espacio
            sh """
                docker rmi ${env.IMAGE_NAME}:${env.IMAGE_TAG} || true
                docker rmi ${env.IMAGE_NAME}:latest || true
            """
            cleanWs()
        }
    }
}
