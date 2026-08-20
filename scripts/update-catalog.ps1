$ErrorActionPreference = "Stop"

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Executable,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $Arguments
  )

  & $Executable @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Executable failed with exit code $LASTEXITCODE."
  }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git is required to publish a catalog update."
}

$ghCommand = Get-Command gh -ErrorAction SilentlyContinue
if ($ghCommand) {
  $ghExecutable = $ghCommand.Source
} else {
  $ghExecutable = Join-Path $env:ProgramFiles "GitHub CLI\gh.exe"
}

if (-not (Test-Path -LiteralPath $ghExecutable)) {
  throw "GitHub CLI is required. Install it and authenticate once before publishing catalog updates."
}

$changes = git status --porcelain
if ($LASTEXITCODE -ne 0) {
  throw "Unable to read the Git working tree."
}
if ($changes) {
  throw "Commit or stash the current changes before refreshing the catalog."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$branch = "catalog/refresh-$timestamp"

Invoke-Checked git switch main
Invoke-Checked git pull --ff-only origin main
Invoke-Checked git switch -c $branch

try {
  Invoke-Checked npm run catalog:sync
  Invoke-Checked npm run test
  Invoke-Checked git add -- data/catalog.json public/catalog

  git diff --cached --quiet
  if ($LASTEXITCODE -eq 0) {
    Write-Output "The public catalog is already current. No pull request was created."
    exit 0
  }
  if ($LASTEXITCODE -ne 1) {
    throw "Unable to inspect the staged catalog update."
  }

  Invoke-Checked git commit -m "chore: refresh public catalog"
  Invoke-Checked git push --set-upstream origin $branch
  Invoke-Checked $ghExecutable pr create --draft --base main --head $branch --title "Refresh public catalog" --body "Automated public catalog snapshot refresh. Catalog safety tests passed locally."
} catch {
  Write-Error $_
  Write-Output "The update branch '$branch' was kept so the failure can be inspected safely."
  exit 1
}

Write-Output "Catalog update published as a draft pull request. Review and merge it to deploy through Vercel."
