param(
  [string]$LocalFilePath = "solution.js",
  [string]$UserHost = "S5582010@gblearn.com"
)

$ErrorActionPreference = 'Stop'

$RemoteDir = "~/public_html/comp1235/assignments/assignment4"
$RemoteFileName = "solution.js"

if (-not (Test-Path -LiteralPath $LocalFilePath)) {
  Write-Error "Local file not found: $LocalFilePath"
  Write-Host "Usage: .\upload_solution.ps1 -LocalFilePath path\to\solution.js [-UserHost user@host]" -ForegroundColor Yellow
  exit 1
}

# Common SSH options: allow password prompts and auto-accept new host keys
$sshArgsEnsureDir = @(
  '-o','BatchMode=no',
  '-o','StrictHostKeyChecking=accept-new',
  $UserHost,
  "mkdir -p '$RemoteDir'"
)

$scpArgsUpload = @(
  '-o','BatchMode=no',
  '-o','StrictHostKeyChecking=accept-new',
  '--',
  $LocalFilePath,
  "$UserHost:$RemoteDir/$RemoteFileName"
)

try {
  Write-Host "Ensuring remote directory exists..." -ForegroundColor Cyan
  & ssh @sshArgsEnsureDir
  if ($LASTEXITCODE -ne 0) { throw "ssh mkdir failed with exit code $LASTEXITCODE" }

  Write-Host "Uploading $LocalFilePath to $UserHost:$RemoteDir/$RemoteFileName ..." -ForegroundColor Cyan
  & scp @scpArgsUpload
  if ($LASTEXITCODE -ne 0) { throw "scp upload failed with exit code $LASTEXITCODE" }

  Write-Host "Upload complete: $UserHost:$RemoteDir/$RemoteFileName" -ForegroundColor Green
}
catch {
  Write-Error $_
  exit 1
}