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
                dir("${WORK_DIR}") {
                    sh "mkdir -p "${WORK_DIR}" && rm -rf "${WORK_DIR}"/*"
                    
                    // Downloading the artifacts
                    checkout scmGit(
                        branches: [[name: "${env.GIT_BRANCH}"]], 
                        extensions: [], 
                        userRemoteConfigs: [[url: "${env.GIT_REPO}"]]
                    )
                    // 3. Verify the files exist
                    sh "ls -lrt"
                }
            }
        }
    }

}