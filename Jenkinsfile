pipeline {
    agent any

    environment {
        imageName = 'registry.hua27.duckdns.org/k1-api'
        registryCredential = 'registry'
        dockerImage = ''
        notifyUrl = 'exchange-rate-asset-manager-notify-url'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'master', credentialsId: 'jenkins', url: 'git@bitbucket.org:caulfield33/k1-api.git'
            }
        }

        stage('Stop previous version') {
            steps {
                script {
                      try {
                            docker.withRegistry('https://registry.hua27.duckdns.org', registryCredential) {
                                sh 'docker stop $(docker ps -q -a --filter name=k1-api )'
                            }
                      } catch (Exception e) {
                          echo 'Exception occurred: ' + e.toString()
                      }
                }
            }
        }

        stage('Remove previous version') {
            steps {
                script {
                      try {
                            docker.withRegistry('https://registry.hua27.duckdns.org', registryCredential) {
                                sh 'docker rm $(docker ps -q -a --filter name=k1-api )'
                            }
                      } catch (Exception e) {
                          echo 'Exception occurred: ' + e.toString()
                      }
                }
            }
        }

        stage('Remove previous version image') {
            steps {
                script {
                        try {
                            sh 'docker rmi $(docker images "registry.hua27.duckdns.org/k1-api" -a -q)'
                        } catch (Exception e) {
                            echo 'Exception occurred: ' + e.toString()
                        }

                }
            }
        }

        stage('Build Docker Image') {
            steps{
                script {
                    dockerImage = docker.build imageName + ":$BUILD_NUMBER"
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    docker.withRegistry('https://registry.hua27.duckdns.org', registryCredential) {
                        dockerImage.push()
                    }
                }
            }
        }

        stage('Run new container') {
            steps {
                script {
                    sh '''
                        docker run -d \
                        --name k1-api \
                        --restart always \
                        -p 3110:3110 \
                        registry.hua27.duckdns.org/k1-api:$BUILD_NUMBER
                    '''
                }
            }
        }

    }

        post {
            success {
                withCredentials([ string(credentialsId: notifyUrl, variable: 'NOTIFY_URL') ]) {
                    sh  '''
                    curl -k -X POST -H "Content-Type: application/json" -d '{
                      "build": "Success",
                      "service": "k1-api",
                      "version": "'$BUILD_NUMBER'",
                      "icon": "🟢"
                    }' "$NOTIFY_URL"
                    '''
                }
            }

            failure {
                withCredentials([ string(credentialsId: notifyUrl, variable: 'NOTIFY_URL') ]) {
                    sh  '''
                    curl -k -X POST -H "Content-Type: application/json" -d '{
                      "build": "Failure",
                      "service": "k1-api",
                      "version": "'$BUILD_NUMBER'",
                      "icon": "🔴"
                    }' "$NOTIFY_URL"
                    '''
                }
            }
    }
}
