const config = require('../config');
const core = require('@actions/core');

const globalConfig = [
      '#!/bin/bash',
      'apt-get update && apt-get install libicu60 -y',
      'mkdir -p /tmp && cd /tmp',
      'case $(uname -m) in aarch64) ARCH="arm64" ;; amd64|x86_64) ARCH="x64" ;; esac && export RUNNER_ARCH=${ARCH}',
      'curl -O -L https://github.com/actions/runner/releases/download/v2.332.0/actions-runner-linux-x64-2.332.0.tar.gz',
].join("\n");

function createRegistration(label, githubRegistrationToken) {
  return [
      'mkdir -p /tmp/runner && cd /tmp/runner',
      `tar xzf /tmp/actions-runner-linux-x64-2.332.0.tar.gz -C /tmp/runner`,
      'export RUNNER_ALLOW_RUNASROOT=1',
      `./config.sh --url https://github.com/${config.githubContext.owner}/${config.githubContext.repo} --token ${githubRegistrationToken} --labels ${label} --name ${label} --unattended`,
      './run.sh 2>&1 &'
  ].join("\n");
}

async function getUserData(label, createRegistrations) {
  const registrationCallback = (githubRegistrationToken) => {
    return createRegistration(label, githubRegistrationToken);
  };

  const registrations = await createRegistrations(registrationCallback)

  const vanillaAMIUserData = [
    globalConfig,
    registrations.join("\n"),
  ].join("\n");

  core.debug(`AMI userdata: ${vanillaAMIUserData}`);

  return Buffer.from(vanillaAMIUserData).toString('base64');
}

module.exports = {
  getUserData
}
