pipeline {
    
    agent {label 'agent1'}

    // parameters {
    //     string(name: 'TAG_NAME', defaultValue: 'v0.1', description: 'Provide tag to deploy the project')
    // }

    environment {
        
        GIT_REPO = "https://github.com/shrinathb05/web_css.git"
        GIT_BRANCH = "dev"

        SONAR_SERVER_NAME = "sonar-server"
        OWASP_TOOL_NAME = "owasp-dpcheck"

        WORK_DIR = "/home/ubuntu/var/work/webapp"
        
    }

    stages {
        stage('Clean & Checkout') {
            steps {
                script {
                    // Ensure the parent directory exists
                    sh "mkdir -p ${env.WORK_DIR}"
                }
                dir("${env.WORK_DIR}") {
                    deleteDir() // Clean the specific WORK_DIR
                    checkout scmGit(
                        branches: [[name: "${env.GIT_BRANCH}"]],
                        userRemoteConfigs: [[url: "${env.GIT_REPO}"]]
                    )
                }
            }
        }

        stage("Install Dependencies") {
            steps {
                dir("${env.WORK_DIR}") {
                    echo "Installing dependencies in ${env.WORK_DIR}..."
                    sh "npm ci --quiet"
                }
            }
        }

        stage("Install Playwright Browser") {
            steps {
                dir("${env.WORK_DIR}") {
                    echo "Configuring Playwright environment..."
                    sh "npx playwright install chromium"
                }
            }
        }

        stage('Lint') {
            steps {
                dir("${WORK_DIR}") {
                    echo "Running Linter (ESLint/Prettier)......."
                    sh 'npm run lint'
                }
            }
        }
        
        stage('Unit Tests') {
            steps {
                dir("${WORK_DIR}") {
                    echo "Running the unit tests......"
                    script {
                        echo "Installing additional packages"
                        sh "npm install --save-dev jest-junit"
                        try {
                            // Removed the extra --coverage since it is in your package.json
                            // Added --passWithNoTests to prevent failure if no tests exist yet
                            sh "CI=true npm run test:unit -- --reporter=default --reporter=junit --outputFile=junit.xml --passWithNoTests"
                        } catch (Exception e) {
                            currentBuild.result = 'FAILURE'
                            echo "Unit tests failed, but continuing to post-actions for reporting."
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            dir("${env.WORK_DIR}") {
                echo "Archiving Test and Coverage Reports..."
                
                // 1. Capture JUnit XML results to show the "Test Result" trend graph
                // Adjust the path to where your runner saves the XML (e.g., junit.xml)
                junit allowEmptyResults: true, testResults: '**/junit.xml'

                // 2. Archive the HTML Coverage report so you can view it in Jenkins
                publishHTML([
                    allowMissing: true,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'coverage/lcov-report',
                    reportFiles: 'index.html',
                    reportName: 'Unit Test Coverage'
                ])
            }
        }
        cleanup {
            echo "Cleaning up workspace..."
            // Optional: deleteDir() 
            // In production, some prefer to keep the WORK_DIR for debugging, 
            // but deleteDir() keeps the agent storage healthy.
        }
    }

}