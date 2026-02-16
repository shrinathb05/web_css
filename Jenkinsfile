pipeline {
    agent any

    parameters {
        string(name: 'TAG_VERSION', defaultValue: '0.0.1', description: 'GitHub Tag to deploy')
    }

    environment {
        NGINX_IP    = "10.181.63.24"
        SSH_USER    = "jenkins"
        DEPLOY_DIR  = "/var/www/html"
        BACKUP_DIR  = "/home/jenkins/backup"
        REPO_USER   = "shrinathb05"
        REPO_NAME   = "web_css"
    }

    stages {
        stage('1. Fetch Source') {
            steps {
                deleteDir()
                echo "📥 Downloading Tag: ${params.TAG_VERSION}"
                withCredentials([string(credentialsId: 'GITHUB_TOKEN', variable: 'TOKEN')]) {
                    sh 'curl -f -L -H "Authorization: token $TOKEN" https://github.com/$REPO_USER/$REPO_NAME/archive/refs/tags/${TAG_VERSION}.zip -o source.zip'
                }
            }
        }

        stage('2. Extract & Clean') {
            steps {
                echo "📦 Extracting content in Jenkins Workspace..."
                sh """
                    unzip -q source.zip
                    mv ${REPO_NAME}-*/* ./
                    rm -rf source.zip ${REPO_NAME}-*
                """
            }
        }

        stage('3. Remote Backup') {
            steps {
                sshagent(['nginx-server-key']) {
                    script {
                        def timestamp = sh(script: "date +%Y%m%d%H%M%S", returnStdout: true).trim()
                        echo "🛡️ Creating Remote Backup on Nginx..."
                        sh """
                            ssh -T -o StrictHostKeyChecking=no ${SSH_USER}@${NGINX_IP} << 'EOF'
                                set -e
                                sudo /usr/bin/mkdir -p ${BACKUP_DIR}
                                if [ -d "${DEPLOY_DIR}" ] && [ "\$(ls -A ${DEPLOY_DIR})" ]; then
                                    sudo /usr/bin/tar -czf ${BACKUP_DIR}/web_${timestamp}.tar.gz -C ${DEPLOY_DIR} .
                                    echo "Backup Saved: web_${timestamp}.tar.gz"
                                fi
EOF
                        """
                    }
                }
            }
        }

        stage('4. Deploy Files') {
            steps {
                sshagent(['nginx-server-key']) {
                    echo "🚀 Transferring files to Nginx Server..."
                    sh """
                        ssh -T -o StrictHostKeyChecking=no ${SSH_USER}@${NGINX_IP} "sudo /usr/bin/systemctl stop nginx && sudo /usr/bin/rm -rf ${DEPLOY_DIR}/*"
                        scp -r ./* ${SSH_USER}@${NGINX_IP}:${DEPLOY_DIR}/
                    """
                }
            }
        }

        stage('5. Verify & Start') {
            steps {
                sshagent(['nginx-server-key']) {
                    echo "✅ Starting Nginx and Verifying..."
                    sh """
                        ssh -T -o StrictHostKeyChecking=no ${SSH_USER}@${NGINX_IP} << 'EOF'
                            set -e
                            sudo /usr/bin/systemctl start nginx
                            sudo /usr/bin/systemctl is-active --quiet nginx && echo "Nginx is Live!"
EOF
                    """
                }
            }
        }
    }

    post {
        always {
            deleteDir()
            echo "Pipeline Complete."
        }
        success {
            echo "✅ SUCCESS: Version ${params.TAG_VERSION} is now live."
        }
        failure {
            echo "❌ FAILURE: Check the failed stage in the Stage View."
        }
    }
}