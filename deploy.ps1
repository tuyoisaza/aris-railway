# ============================
# ARIS Cloud Run Deployment Script (Windows / PowerShell)
# ============================

$ErrorActionPreference = "Stop"

Write-Host "=== ARIS: Cloud Run deployment starting ==="

# ---- Hard defaults (project-specific, overrideable) ----
if (-not (Test-Path "Env:GCP_PROJECT_ID")) {
    $env:GCP_PROJECT_ID = "aris-482504"
}

if (-not (Test-Path "Env:GCP_REGION")) {
    $env:GCP_REGION = "us-central1"
}

Write-Host "Using GCP project: $($env:GCP_PROJECT_ID)"
Write-Host "Using GCP region:  $($env:GCP_REGION)"

# ---- Load .env file if present (build-time only) ----
if (Test-Path ".env") {
    Write-Host "Loading environment variables from .env"

    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*#') { return }
        if ($_ -match '^\s*$') { return }

        $parts = $_ -split '=', 2
        if ($parts.Count -eq 2) {
            $name = $parts[0].Trim()
            $value = $parts[1].Trim()
            Set-Item -Path "Env:$name" -Value $value
        }
    }
}

# ---- Required build-time and runtime variables ----
$requiredVars = @(
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_KEY",
    "VITE_STRIPE_PRICE_PLUS",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
    "STRIPE_SECRET_KEY",
    "OPENAI_API_KEY",
    "RESEND_API_KEY"
)

# ---- Load .env file if present ----
if (Test-Path ".env") {
    Write-Host "Loading environment variables from .env"

    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -match '^\s*#') { return }
        if ($line -match '^\s*$') { return }

        $parts = $line -split '=', 2
        if ($parts.Count -eq 2) {
            $name = $parts[0].Trim()
            $value = $parts[1].Trim()
            
            # Remove potential quotes around value
            $value = $value -replace '^["'']', '' -replace '["'']$', ''
            
            Set-Item -Path "Env:$name" -Value $value
        }
    }
}

foreach ($var in $requiredVars) {
    if (-not (Test-Path "Env:$var") -or [string]::IsNullOrWhiteSpace((Get-Item "Env:$var").Value)) {
        throw "Missing required environment variable: $var (Check your .env file)"
    }
}

Write-Host "Verifying essential variables..."
$subUrl = (Get-Item Env:SUPABASE_URL).Value
$subKey = (Get-Item Env:SUPABASE_SERVICE_KEY).Value
Write-Host "- SUPABASE_URL: $($subUrl.Substring(0, [Math]::Min(15, $subUrl.Length)))..."
Write-Host "- SUPABASE_SERVICE_KEY: $($subKey.Substring(0, [Math]::Min(10, $subKey.Length)))..."

# ---- Sanity checks ----
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker CLI not found."
}

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    throw "gcloud CLI not found. Install Google Cloud SDK."
}

Write-Host "Checking Docker daemon..."
docker info | Out-Null
Write-Host "Docker daemon is reachable."

# ---- Ensure required GCP APIs are enabled ----
Write-Host "Ensuring required Google Cloud APIs are enabled..."

$apis = @(
    "artifactregistry.googleapis.com",
    "run.googleapis.com"
)

foreach ($api in $apis) {
    Write-Host "Enabling API: $api"
    gcloud services enable $api --project $env:GCP_PROJECT_ID --quiet
}

Write-Host "Waiting for API propagation..."
Start-Sleep -Seconds 10

# ---- Artifact Registry configuration ----
$projectId = $env:GCP_PROJECT_ID
$region = $env:GCP_REGION
$repoName = "aris-repo"

# ---- Ensure Artifact Registry repository exists ----
Write-Host "Ensuring Artifact Registry repository exists..."

$repoExists = gcloud artifacts repositories list `
    --project $projectId `
    --location $region `
    --format "value(name)" `
| Select-String "/$repoName$"

if (-not $repoExists) {
    Write-Host "Creating Artifact Registry repository: $repoName"

    gcloud artifacts repositories create $repoName `
        --project $projectId `
        --location $region `
        --repository-format docker `
        --description "ARIS container images" `
        --quiet
}
else {
    Write-Host "Artifact Registry repository already exists."
}

# ---- Authenticate Docker to Artifact Registry ----
Write-Host "Authenticating Docker with Google Artifact Registry..."
gcloud auth configure-docker "$region-docker.pkg.dev" --quiet

# ---- Image configuration ----
$serviceName = "aris"
$imageUri = "$region-docker.pkg.dev/$projectId/$repoName/aris:latest"

# ---- Measure build context (diagnostic) ----
Write-Host "Measuring Docker build context size..."

$excludePatterns = @('node_modules', '.git', 'dist', 'android', 'ios')
$contextFiles = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $path = $_.FullName
    -not ($excludePatterns | Where-Object { $path -match [regex]::Escape($_) })
}
$contextSizeMB = ($contextFiles | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ("Build context estimate: {0:N2} MB" -f $contextSizeMB)

if ($contextSizeMB -gt 50) {
    Write-Warning "Build context is large (>50MB). Review .dockerignore for improvements."
}

# ---- Build Docker image ----
Write-Host "Building Docker image..."

docker build `
    --progress=plain `
    --build-arg VITE_SUPABASE_URL=$env:VITE_SUPABASE_URL `
    --build-arg VITE_SUPABASE_KEY=$env:VITE_SUPABASE_KEY `
    --build-arg VITE_STRIPE_PRICE_PLUS=$env:VITE_STRIPE_PRICE_PLUS `
    -t $imageUri `
    .

if ($LASTEXITCODE -ne 0) {
    throw "Docker build failed"
}

# ---- Report image size ----
$imageSize = docker images $imageUri --format "{{.Size}}"
Write-Host "Docker image built: $imageUri"
Write-Host "Final image size: $imageSize"

# ---- Push image ----
Write-Host "Pushing image to Artifact Registry..."
docker push $imageUri

if ($LASTEXITCODE -ne 0) {
    throw "Docker push failed"
}

# ---- Deploy to Cloud Run ----
Write-Host "Deploying to Cloud Run..."

# Build runtime environment variables string for Cloud Run
# These are backend-only variables (NOT baked into image)
$runtimeEnvVars = @(
    "SUPABASE_URL=$env:SUPABASE_URL",
    "SUPABASE_SERVICE_KEY=$env:SUPABASE_SERVICE_KEY",
    "STRIPE_SECRET_KEY=$env:STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET=$env:STRIPE_WEBHOOK_SECRET",
    "OPENAI_API_KEY=$env:OPENAI_API_KEY",
    "OPENAI_ORG_ID=$env:OPENAI_ORG_ID",
    "RESEND_API_KEY=$env:RESEND_API_KEY",
    "NODE_ENV=production"
) -join ","

Write-Host "Setting runtime environment variables..."

gcloud run deploy $serviceName `
    --image $imageUri `
    --region $region `
    --project $projectId `
    --platform managed `
    --allow-unauthenticated `
    --port 3000 `
    --set-env-vars "$runtimeEnvVars" `
    --quiet

Write-Host "=== ARIS successfully deployed to Cloud Run ==="
