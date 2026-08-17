param(
  [Parameter(Mandatory = $true)][string]$Base,
  [Parameter(Mandatory = $true)][string]$Head,
  [string]$Outfile = ""
)

git rev-parse --verify --quiet "$Base" | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Error "bad BASE: $Base"; exit 2 }
git rev-parse --verify --quiet "$Head" | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Error "bad HEAD: $Head"; exit 2 }

if (-not $Outfile) {
  $base7 = git rev-parse --short $Base
  $head7 = git rev-parse --short $Head
  $Outfile = Join-Path (Join-Path (git rev-parse --show-toplevel) ".superpowers\sdd") "review-$base7..$head7.diff"
}

$content = @(
  "# Review package: ${Base}..${Head}"
  ""
  "## Commits"
  (git log --oneline "${Base}..${Head}")
  ""
  "## Files changed"
  (git diff --stat "${Base}..${Head}")
  ""
  "## Diff"
  (git diff -U10 "${Base}..${Head}")
)

$dir = Split-Path -Parent $Outfile
if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$content -join "`n" | Set-Content -LiteralPath $Outfile -Encoding utf8
$commits = (git rev-list --count "${Base}..${Head}").Trim()
Write-Output "wrote $Outfile : $commits commit(s), $((Get-Item -LiteralPath $Outfile).Length) bytes"
