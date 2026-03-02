const config = require('../config');
const core = require('@actions/core');

const preMetadata = "<powershell>";
const scheduleEmergencyShutdown = "shutdown /s /t 5400"; // 1 hour and a half

const globalConfig = [
  // Create runner dir
  'mkdir C:\\actions-runner; cd C:\\actions-runner',
  // Download GitHub Runner
  'Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.332.0/actions-runner-win-x64-2.332.0.zip -OutFile actions-runner-win-x64-2.332.0.zip',
  // Check hash is good
  'if((Get-FileHash -Path actions-runner-win-x64-2.332.0.zip -Algorithm SHA256).Hash.ToUpper() -ne \'sha256:83e56e05b21eb58c9697f82e52c53b30867335ff039cd5d44d1a1a24d2149f4b\'.ToUpper()){ throw \'Computed checksum did not match\' }',
].join("\n");

function createRegistration(label, githubRegistrationToken) {
  return [
    // Extract runner .zip
    'Add-Type -AssemblyName System.IO.Compression.FileSystem ; [System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD/actions-runner-win-x64-2.332.0.zip", "$PWD")',
    // Configure the runner for the current repo
    `.\\config.cmd --url https://github.com/${config.githubContext.owner}/${config.githubContext.repo} --token ${githubRegistrationToken} --labels ${label} --name ${label} --unattended`,
    // Run it!
    'start-process -Filepath run.cmd'
  ].join("\n");
}

const postMetadata = "</powershell>";

async function getUserData(label, createRegistrations) {
  const registrationCallback = (githubRegistrationToken) => {
    return createRegistration(label, githubRegistrationToken);
  };

  const registrations = await createRegistrations(registrationCallback)

  const vanillaAMIUserData = [
    preMetadata,
    scheduleEmergencyShutdown,
    globalConfig,
    registrations.join("\n"),
    postMetadata
  ].join("\n");

  core.debug(`AMI userdata: ${vanillaAMIUserData}`);

  return Buffer.from(vanillaAMIUserData).toString('base64');
}

module.exports = {
  getUserData
}
