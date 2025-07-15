pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'gmaldo/employee_app'
        DOCKER_TAG = 'latest'
        DOCKER_CREDENTIALS_ID = 'dockerhub_id' // Jenkins credentials ID
    }

    stages {
        stage('Clonar código') {
            steps {
                checkout scm
            }
        }

        stage('Construir imagen Docker') {
            steps {
                script {
                    // Build from the employee_app directory where Dockerfile is located
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}", "./employee_app")
                }
            }
        }

        stage('Login en Docker Hub') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKER_CREDENTIALS_ID}") {
                        echo 'Login exitoso en Docker Hub'
                    }
                }
            }
        }

        stage('Push a Docker Hub') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKER_CREDENTIALS_ID}") {
                        def image = docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}", "./employee_app")
                        image.push()
                        // Also push with build number for versioning
                        image.push("${BUILD_NUMBER}")
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Imagen publicada en Docker Hub: ${DOCKER_IMAGE}:${DOCKER_TAG}"
        }
        failure {
            echo "Error en el pipeline"
        }
    }
}