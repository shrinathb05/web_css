pipeline {
    agent any

    parameters {
        string(name: 'TAG_VERSION', defaultValue: '0.0.1', description: 'GitHub Tag to deploy')
    }

    environment {
        // Nginx Server Details
        NGINX_IP = "10.181.63.24"
        SSH_USER = "jenkins"
        
        // Remote Paths on Nginx Server
        DEPLOY_DIR = "/var/www/html"
        BACKUP_DIR = "/home/jenkins/backup"
        
        // GitHub Repository Details
        REPO_USER = "shrinathb05"
        REPO_NAME = "web_css"
    }

    stages {
        stage('1. Prepare Content in Jenkins Workspace') {
            steps {
                // Jenkins workspace is our WORK_DIR
                deleteDir() 
                echo "Downloading source for Tag: ${params.TAG_VERSION}..."
                
                withCredentials([string(credentialsId: 'GITHUB_TOKEN', variable: 'TOKEN')]) {
                    sh """
                        curl -L -H "Authorization: token ${TOKEN}" \
                        https://github.com/${REPO_USER}/${REPO_NAME}/archive/refs/tags/${params.TAG_VERSION}.zip -o source.zip
                    """
                }
                
                echo "Extracting content locally in Jenkins Workspace..."
                sh "unzip -q source.zip"
                
                // GitHub zips extract into a folder (e.g., web_css-0.0.1)
                // Moving files to the workspace root
                sh "mv ${REPO_NAME}-*/* ./"
                
                // Remove the zip and the empty folder to keep workspace clean
                sh "rm -rf source.zip ${REPO_NAME}-*" 
            }
        }

        stage('2. Deploy from Workspace to Nginx') {
            steps {
                sshagent(['nginx-server-key']) {
                    script {
                        def timestamp = sh(script: "date +%Y%m%d%H%M%S", returnStdout: true).trim()
                        
                        // Step A, B, and C: Remote Prep
                        sh """
                            ssh -o StrictHostKeyChecking=no ${SSH_USER}@${NGINX_IP} << 'EOF'
                                set -e
                                # Create Backup
                                sudo mkdir -p ${BACKUP_DIR}
                                if [ -d "${DEPLOY_DIR}" ] && [ "\$(ls -A ${DEPLOY_DIR})" ]; then
                                    sudo tar -czf ${BACKUP_DIR}/web_${timestamp}.tar.gz -C ${DEPLOY_DIR} .
                                    echo "Backup created: web_${timestamp}.tar.gz"
                                fi

                                # Stop Nginx
                                if systemctl is-active --quiet nginx; then
                                    sudo systemctl stop nginx
                                    echo "Log: Nginx stopped."
                                fi

                                # Clear deployment directory
                                sudo rm -rf ${DEPLOY_DIR}/*
EOF
                        """

                        // Step D: Deploy from Jenkins Workspace to Nginx via SCP
                        echo "Transferring files from Jenkins Workspace to ${NGINX_IP}..."
                        sh "scp -r ./* ${SSH_USER}@${NGINX_IP}:${DEPLOY_DIR}/"

                        // Step E: Restart Nginx
                        sh """
                            ssh -o StrictHostKeyChecking=no ${SSH_USER}@${NGINX_IP} << 'EOF'
                                set -e
                                sudo systemctl start nginx
                                if systemctl is-active --quiet nginx; then
                                    echo "Log: Nginx started successfully!"
                                else
                                    echo "Log: Nginx failed to start!" && exit 1
                                fi
EOF
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline execution finished."
        }
        success {
            echo "-------------- Deployment Successful --------------"
            echo "Version: ${params.TAG_VERSION}"
        }
        failure {
            echo "❌ Deployment Failed. Check console output."
        }
    }
}