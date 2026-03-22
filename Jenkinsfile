pipeline {
    
    agent {label 'agent1'}

    // parameters {
    //     string(name: 'TAG_NAME', defaultValue: 'v0.1', description: 'Provide tag to deploy the project')
    // }

    environment {
        
        GIT_REPO = "https://github.com/shrinathb05/web_css.git"
        GIT_BRANCH = "dev"
        SONAR_SERVER_NAME = "sonar-server"
        OWASP_CHECK_NAME = 'owasp-dp-Check'
        WORK_DIR = "/home/ubuntu/var/work/libertyapp"
        
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

        stage("Install Playwright Browser & Lint") {
            steps {
                dir("${env.WORK_DIR}") {
                    echo "Configuring Playwright environment..."
                    sh "npx playwright install chromium"

                    echo "Running Linter (ESLint/Prettier)......."
                    sh 'npm run lint'
                }
            }
        }
        
        stage('Unit & Integration Tests') {
            steps {
                dir("${WORK_DIR}") {
                    script {
                        // Unit Tests
                        echo "Running the unit tests......"
                        try {
                            // Removed the extra --coverage since it is in your package.json
                            // Added --passWithNoTests to prevent failure if no tests exist yet
                            sh "CI=true npm run test:unit -- --reporter=default --reporter=junit --outputFile=reports/vitest/results.xml --passWithNoTests"
                        } catch (Exception e) {
                            currentBuild.result = 'FAILURE'
                            echo "Unit tests failed, but continuing to post-actions for reporting."
                        }
                        
                        // Integration Tests
                        echo "Running Playwright Integration Tests..."
                        try {
                            // 1. CI=true ensures Playwright runs in headless mode
                            // 2. --reporter=junit,list gives us both console output and an XML file
                            sh "PLAYWRIGHT_JUNIT_OUTPUT_NAME=reports/playwright/results.xml CI=true npx playwright test --reporter=junit,list"
                        } catch (Exception e) {
                            currentBuild.result = 'FAILURE'
                            echo "Integration tests failed. Check the Playwright report for details."
                        }
                    }
                }
            }
        }

        stage('Security Checks') {
            steps {
                dir("${WORK_DIR}") {
                    echo "Running Security Audits..."
                    script {
                        try {
                            // 1. Run NPM Audit (High/Critical only)
                            sh "npm run audit:npm"

                            // 2. Run Retire.js (Scans for insecure JS libraries)
                            sh "npm run audit:retire"
                        } catch (Exception e) {
                            // In production, we usually fail the build if security issues are found
                            currentBuild.result = 'FAILURE'
                            error "Security vulnerabilities detected! Please check the audit reports."
                        }

                        // 3. NEW: OWASP Dependency-Check
                        // This uses the Jenkins Plugin 'dependency-check-jenkins'
                        withCredentials([string(credentialsId: 'nvd-api-key', variable: 'NVD_KEY')]) {
                            script {
                                // Use a single string without commas between arguments
                                // Added --project name which is often required by the CLI
                                def odcArgs = "--scan ./ --format ALL --out reports/owasp --nvdApiKey ${NVD_KEY} --nodeAuditSkip --project collector-hub"
                                
                                dependencyCheck additionalArguments: odcArgs, 
                                                odcInstallation: "${OWASP_CHECK_NAME}"
                            }
                        }
                        
                    }
                }
            }
        }

        stage('Sonarqube Analysis') {
            steps {
                dir("${WORK_DIR}") {
                    script {
                        //Prepare SonarQube Reports
                        echo "Formatting test execution reports for SonarScanner..."
                        // This runs your custom script to bridge Vitest -> SonarQube
                        sh "npm run sonar:prepare"
                        sh "ls -R reports/sonar/"

                        //SonarQube Scan
                        withSonarQubeEnv("${env.SONAR_SERVER_NAME}") {
                        echo "Starting SonarScanner analysis..."
                        sh """
                            npx sonar-scanner \
                            -Dsonar.projectKey=collector-hub-static-site \
                            -Dsonar.sources=. \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                            -Dsonar.testExecutionReportPaths=reports/sonar/test-execution.xml \
                            -Dsonar.exclusions=node_modules/**,playwright-report/**,dist/**
                        """
                    }
                    }
                }
            }
        }

        stage('Quality Gate') {
            options {
                // If SonarQube doesn't respond in 5 minutes, fail the stage
                timeout(time: 5, unit: 'MINUTES') 
            }
            steps {
                dir("${env.WORK_DIR}") {
                    echo "Waiting for SonarQube Quality Gate result..."
                    // This requires a Webhook configured in SonarQube pointing to Jenkins
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }

    post {
        always {
            dir("${env.WORK_DIR}") {

                // Combine Unit and Integration XML results
                // This looks for any .xml file in the workspace
                junit allowEmptyResults: true, testResults: '**/junit.xml, **/results.xml'

                // Archive the security reports folder
                archiveArtifacts artifacts: 'reports/*.json', allowEmptyArchive: true

                script {
                    // Archive Playwright HTML Report if it exists
                    if (fileExists("playwright-report/index.html")) {
                        publishHTML([
                            allowMissing: true,
                            alwaysLinkToLastBuild: true,
                            keepAll: true,
                            reportDir: 'playwright-report',
                            reportFiles: 'index.html',
                            reportName: 'Playwright Integration Report'
                        ])
                    }

                    // Only publish if Vitest successfully created the coverage folder
                    if (fileExists("coverage/lcov-report/index.html")) {
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
            }
        }
        success {
            echo "Pipeline Completed Successfully! Sending notification..."
            // Optional: mail to: 'admin@example.com', subject: "Build Success", body: "Build ${env.BUILD_NUMBER} is live."
        }
        failure {
            echo "Pipeline Failed. Cleaning up temporary artifacts..."
        }
        cleanup {
            echo "Cleaning up workspace..."
            // cleanWs()
            // Optional: deleteDir() 
            // In production, some prefer to keep the WORK_DIR for debugging, 
            // but deleteDir() keeps the agent storage healthy.
        }
    }

}
