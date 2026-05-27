param(
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [string]$OutputFile = (Join-Path $PSScriptRoot "schema-dump.sql")
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  throw "DATABASE_URL nao foi informada. Defina a variavel de ambiente DATABASE_URL ou passe -DatabaseUrl."
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
  throw "pg_dump nao encontrado no PATH. Instale o PostgreSQL Client Tools ou adicione o pg_dump ao PATH."
}

$outputDir = Split-Path -Parent $OutputFile
if ($outputDir -and -not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

& $pgDump.Source `
  --schema-only `
  --no-owner `
  --no-privileges `
  --clean `
  --if-exists `
  --file $OutputFile `
  $DatabaseUrl

Write-Host "Dump da estrutura gerado em: $OutputFile"
