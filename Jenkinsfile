#! groovy
library 'pipeline-library'
// TODO: Could we make this an array and test across multiple major versions
def nodeVersion = '8.9.1'

def unitTests(os, nodeVersion) {
  return {
    node(os) {
      try {
        nodejs(nodeJSInstallationName: "node ${nodeVersion}") {
          timeout(15) {
            unstash 'sources'
            // Install yarn if not installed
            ensureYarn()
            command 'yarn install' // runs bat on win, sh on unix/mac

            try {
              command 'yarn run coverage' // runs bat on win, sh on unix/mac
            } finally {
              // record results even if tests/coverage 'fails'
              junit 'junit.xml'
            }
          } // timeout
        } // nodejs
      } finally {
        deleteDir() // wipe the workspace no matter what
      }
    }  // node
  }
}

timestamps {
  def isMaster = false
  def packageVersion

  node('osx || linux') {
    stage('Checkout') {
      // checkout scm
      // Hack for JENKINS-37658 - see https://support.cloudbees.com/hc/en-us/articles/226122247-How-to-Customize-Checkout-for-Pipeline-Multibranch
      // do a git clean before checking out
      checkout([
        $class: 'GitSCM',
        branches: scm.branches,
        extensions: scm.extensions + [[$class: 'CleanBeforeCheckout']],
        userRemoteConfigs: scm.userRemoteConfigs
      ])

      isMaster = env.BRANCH_NAME.equals('master')
      packageVersion = jsonParse(readFile('package.json'))['version']
      currentBuild.displayName = "#${packageVersion}-${currentBuild.number}"
      fingerprint 'package.json'
      stash 'sources'
    }
  }

  stage('Test') {
    parallel(
      'Linux unit tests': unitTests('linux', nodeVersion),
      'OSX unit tests': unitTests('osx', nodeVersion),
      'Windows unit tests': unitTests('windows', nodeVersion),
      failFast: false
	)
  } // Test

} // timestamps
