// ══════════════════════════════════════════════════════════════════════════════
// JENKINSFILE — Pipeline CD con Seguridad y Monitoreo
// Proyecto  : devops-lab-orders — Unidad 3
// Autor     : AlejandroLopezM
// ══════════════════════════════════════════════════════════════════════════════

pipeline {

    agent any

    environment {
        REPO_URL        = 'https://github.com/AlejandroLopezM/devops-lab-orders.git'
        BRANCH          = 'main'
        REGISTRY        = 'ghcr.io'
        IMAGE_NAME      = 'ghcr.io/alejandrolopezm/devops-lab-orders'
        IMAGE_TAG       = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'local'}"
        REGISTRY_CREDS  = credentials('ghcr-credentials')
        SNYK_TOKEN      = credentials('snyk-token')
        K8S_NAMESPACE_STAGING = 'staging'
        K8S_NAMESPACE_PROD    = 'production'
        K8S_DEPLOYMENT        = 'orders-service'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 45, unit: 'MINUTES')
        timestamps()
    }

    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['staging', 'production'], description: 'Ambiente destino')
        booleanParam(name: 'SKIP_SECURITY', defaultValue: false, description: 'Saltar escaneos de seguridad (solo emergencias)')
    }

    stages {

        // ── STAGE 1: Clonar repositorio ───────────────────────────────────────
        stage('Clone Repository') {
            steps {
                echo '📥 Clonando repositorio...'
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "*/${env.BRANCH}"]],
                    userRemoteConfigs: [[url: "${env.REPO_URL}", credentialsId: 'github-credentials']]
                ])
                echo "✅ Commit: ${env.GIT_COMMIT}"
            }
        }

        // ── STAGE 2: Instalar dependencias ───────────────────────────────────
        stage('Install Dependencies') {
            steps {
                echo '📦 Instalando dependencias...'
                sh 'npm ci'
                echo '✅ Dependencias instaladas'
            }
        }

        // ── STAGE 3: Pruebas unitarias ────────────────────────────────────────
        stage('Run Tests') {
            steps {
                echo '🧪 Ejecutando pruebas unitarias...'
                sh 'npm run test:ci'
            }
            post {
                always {
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

        // ── STAGE 4: SonarQube - Análisis estático ────────────────────────────
        stage('SonarQube Analysis') {
            when { expression { return !params.SKIP_SECURITY } }
            steps {
                echo '🔍 Ejecutando análisis estático con SonarQube...'
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        npx sonar-scanner \
                            -Dsonar.projectKey=devops-lab-orders \
                            -Dsonar.projectName="DevOps Lab Orders" \
                            -Dsonar.sources=src \
                            -Dsonar.tests=tests \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                            -Dsonar.qualitygate.wait=true
                    '''
                }
                echo '✅ Análisis SonarQube completado'
            }
        }

        // ── STAGE 5: Snyk - Vulnerabilidades en dependencias ──────────────────
        stage('Snyk Security Scan') {
            when { expression { return !params.SKIP_SECURITY } }
            steps {
                echo '🛡️ Escaneando vulnerabilidades con Snyk...'
                sh '''
                    npm install -g snyk
                    snyk auth ${SNYK_TOKEN}
                    snyk test --severity-threshold=high --json > snyk-report.json || true
                    snyk test --severity-threshold=high || true
                '''
                echo '✅ Escaneo Snyk completado'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'snyk-report.json', allowEmptyArchive: true
                }
            }
        }

        // ── STAGE 6: Construir imagen Docker ──────────────────────────────────
        stage('Build Docker Image') {
            steps {
                echo "🐳 Construyendo imagen: ${env.IMAGE_NAME}:${env.IMAGE_TAG}"
                sh """
                    docker build \
                        --tag ${env.IMAGE_NAME}:${env.IMAGE_TAG} \
                        --tag ${env.IMAGE_NAME}:latest \
                        --label "build=${env.BUILD_NUMBER}" \
                        --label "commit=${env.GIT_COMMIT}" \
                        .
                    echo "✅ Imagen construida"
                """
            }
        }

        // ── STAGE 7: Trivy - Escaneo de imagen Docker ─────────────────────────
        stage('Trivy Image Scan') {
            when { expression { return !params.SKIP_SECURITY } }
            steps {
                echo '🔒 Escaneando imagen con Trivy...'
                sh """
                    if ! command -v trivy &> /dev/null; then
                        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
                    fi
                    trivy image \
                        --severity HIGH,CRITICAL \
                        --exit-code 0 \
                        --ignore-unfixed \
                        --format table \
                        ${env.IMAGE_NAME}:${env.IMAGE_TAG}
                """
                echo '✅ Escaneo Trivy completado'
            }
        }

        // ── STAGE 8: Push al registry ─────────────────────────────────────────
        stage('Push to Registry') {
            steps {
                echo "📤 Publicando en ${env.REGISTRY}..."
                sh """
                    echo ${env.REGISTRY_CREDS_PSW} | docker login ${env.REGISTRY} \
                        -u ${env.REGISTRY_CREDS_USR} --password-stdin
                    docker push ${env.IMAGE_NAME}:${env.IMAGE_TAG}
                    docker push ${env.IMAGE_NAME}:latest
                    echo "✅ Imagen publicada: ${env.IMAGE_NAME}:${env.IMAGE_TAG}"
                """
            }
        }

        // ── STAGE 9: Deploy a Staging ─────────────────────────────────────────
        stage('Deploy to Staging') {
            steps {
                echo "🚀 Desplegando en staging..."
                sh """
                    kubectl set image deployment/${env.K8S_DEPLOYMENT} \
                        orders=${env.IMAGE_NAME}:${env.IMAGE_TAG} \
                        --namespace=${env.K8S_NAMESPACE_STAGING}
                    kubectl rollout status deployment/${env.K8S_DEPLOYMENT} \
                        --namespace=${env.K8S_NAMESPACE_STAGING} \
                        --timeout=120s
                    echo "✅ Deploy en staging exitoso"
                """
            }
        }

        // ── STAGE 10: Pruebas de integración ─────────────────────────────────
        stage('Integration Tests') {
            steps {
                echo '🔬 Ejecutando pruebas de integración...'
                sh """
                    sleep 10
                    STAGING_URL=\$(kubectl get svc ${env.K8S_DEPLOYMENT} \
                        --namespace=${env.K8S_NAMESPACE_STAGING} \
                        -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
                    curl -f http://\${STAGING_URL}:3000/health || exit 1
                    curl -f http://\${STAGING_URL}:3000/api/orders || exit 1
                    echo "✅ Pruebas de integración exitosas"
                """
            }
        }

        // ── STAGE 11: Approval Gate ───────────────────────────────────────────
        stage('Approval Gate') {
            when { expression { return params.DEPLOY_ENV == 'production' } }
            steps {
                echo '⏸️ Esperando aprobación para PRODUCCIÓN...'
                timeout(time: 15, unit: 'MINUTES') {
                    input(message: '¿Aprobar deploy en producción?', ok: 'Aprobar', submitter: 'devops-lead')
                }
            }
        }

        // ── STAGE 12: Deploy a Producción ─────────────────────────────────────
        stage('Deploy to Production') {
            when { expression { return params.DEPLOY_ENV == 'production' } }
            steps {
                echo "🎯 Desplegando en PRODUCCIÓN..."
                sh """
                    kubectl set image deployment/${env.K8S_DEPLOYMENT} \
                        orders=${env.IMAGE_NAME}:${env.IMAGE_TAG} \
                        --namespace=${env.K8S_NAMESPACE_PROD}
                    kubectl rollout status deployment/${env.K8S_DEPLOYMENT} \
                        --namespace=${env.K8S_NAMESPACE_PROD} \
                        --timeout=180s
                    echo "✅ Deploy en producción exitoso: ${env.IMAGE_TAG}"
                """
            }
        }

        // ── STAGE 13: Health Check post-deploy ───────────────────────────────
        stage('Post-Deploy Health Check') {
            when { expression { return params.DEPLOY_ENV == 'production' } }
            steps {
                echo '🏥 Verificando salud en producción...'
                sh """
                    sleep 15
                    PROD_URL=\$(kubectl get svc ${env.K8S_DEPLOYMENT} \
                        --namespace=${env.K8S_NAMESPACE_PROD} \
                        -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
                    curl -f http://\${PROD_URL}:3000/health || {
                        echo "❌ Health check falló - ejecutando rollback..."
                        kubectl rollout undo deployment/${env.K8S_DEPLOYMENT} \
                            --namespace=${env.K8S_NAMESPACE_PROD}
                        exit 1
                    }
                    echo "✅ Servicio en producción operativo"
                """
            }
        }
    }

    post {
        success {
            echo "✅ PIPELINE COMPLETADO - Build #${env.BUILD_NUMBER} - ${env.IMAGE_NAME}:${env.IMAGE_TAG}"
        }
        failure {
            echo "❌ PIPELINE FALLÓ - Build #${env.BUILD_NUMBER} - Revisar logs"
        }
        always {
            sh "docker rmi ${env.IMAGE_NAME}:${env.IMAGE_TAG} || true"
            cleanWs()
        }
    }
}
