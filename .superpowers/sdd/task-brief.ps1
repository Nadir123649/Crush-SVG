param(
  [Parameter(Mandatory = $true)][string]$Plan,
  [Parameter(Mandatory = $true)][int]$TaskNumber,
  [string]$Outfile = ""
)

if (-not $Outfile) {
  $Outfile = Join-Path (Join-Path (git rev-parse --show-toplevel) ".superpowers\sdd") "task-$TaskNumber-brief.md"
}

$lines = Get-Content -LiteralPath $Plan
$inTask = $false
$inFence = $false
$captured = New-Object System.Collections.Generic.List[string]

foreach ($line in $lines) {
  if ($line -match '^```') { $inFence = -not $inFence }
  if (-not $inFence -and $line -match '^#{1,6}[ \t]+Task[ \t]+([0-9]+)([^0-9]|$)') {
    $n = [int]$Matches[1]
    $inTask = ($n -eq $TaskNumber)
  }
  if ($inTask) { $captured.Add($line) }
}

if ($captured.Count -eq 0) {
  Write-Error "task ${TaskNumber} not found in ${Plan}"
  exit 3
}

$dir = Split-Path -Parent $Outfile
if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
Set-Content -LiteralPath $Outfile -Value ($captured -join "`n") -Encoding utf8
Write-Output "wrote $Outfile : $($captured.Count) lines"
