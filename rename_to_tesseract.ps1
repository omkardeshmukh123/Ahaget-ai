# ── rename_to_tesseract.ps1 ───────────────────────────────────────────────────
# Replaces all Prism / OnboardAI brand strings with Tesseract / Tesseract AI
# Run from: d:\prism
# Usage:    .\rename_to_tesseract.ps1

$rootDir = "d:\prism"

# ── Replacement pairs (ORDER MATTERS — most specific first) ───────────────────
$replacements = @(
    # OnboardAI variants
    [pscustomobject]@{ From = "OnboardAI";     To = "Tesseract AI" },
    [pscustomobject]@{ From = "Onboard AI";    To = "Tesseract AI" },
    [pscustomobject]@{ From = "onboardai";     To = "tesseract-ai" },
    [pscustomobject]@{ From = "onboard-ai";    To = "tesseract-ai" },
    [pscustomobject]@{ From = "ONBOARDAI";     To = "TESSERACT-AI" },
    # Prism compound names (render.yaml / package names)
    [pscustomobject]@{ From = "prism-backend";   To = "tesseract-backend" },
    [pscustomobject]@{ From = "prism-dashboard"; To = "tesseract-dashboard" },
    [pscustomobject]@{ From = "prism-landing";   To = "tesseract-landing" },
    [pscustomobject]@{ From = "prism-db";        To = "tesseract-db" },
    [pscustomobject]@{ From = "prism-website";   To = "tesseract-website" },
    [pscustomobject]@{ From = "prism_website";   To = "tesseract_website" },
    # "Prism AI" before bare "Prism"
    [pscustomobject]@{ From = "Prism AI";      To = "Tesseract AI" },
    # Bare Prism
    [pscustomobject]@{ From = "Prism";         To = "Tesseract" },
    [pscustomobject]@{ From = "prism";         To = "tesseract" },
    [pscustomobject]@{ From = "PRISM";         To = "TESSERACT" }
)

# ── File extensions to touch ──────────────────────────────────────────────────
$extensions = @("*.ts","*.tsx","*.js","*.jsx","*.json","*.yaml","*.yml","*.md","*.css","*.html","*.txt","*.env","*.env.example","*.env.local")

# ── Directories to skip entirely ──────────────────────────────────────────────
$skipDirNames = @(".git","node_modules","dist",".next","out",".planning",".worktrees","package-lock.json")

function ShouldSkip($path) {
    foreach ($d in $skipDirNames) {
        if ($path -like "*\$d\*" -or $path -like "*\$d") { return $true }
    }
    return $false
}

# ── Gather files ──────────────────────────────────────────────────────────────
$allFiles = @()
foreach ($ext in $extensions) {
    $found = Get-ChildItem -Path $rootDir -Recurse -Filter $ext -File -ErrorAction SilentlyContinue
    foreach ($f in $found) {
        if (-not (ShouldSkip $f.FullName)) {
            $allFiles += $f
        }
    }
}

$allFiles = $allFiles | Sort-Object FullName -Unique
Write-Host "Found $($allFiles.Count) files to process" -ForegroundColor Cyan

# ── Content replacements ──────────────────────────────────────────────────────
$changedCount = 0
foreach ($file in $allFiles) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $newContent = $content
        foreach ($r in $replacements) {
            $newContent = $newContent.Replace($r.From, $r.To)
        }
        if ($newContent -ne $content) {
            [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
            $rel = $file.FullName.Substring($rootDir.Length + 1)
            Write-Host "  [UPDATED] $rel" -ForegroundColor Green
            $changedCount++
        }
    } catch {
        Write-Host "  [ERROR] $($file.FullName): $_" -ForegroundColor Red
    }
}

Write-Host "`nContent replacements complete: $changedCount files updated." -ForegroundColor Cyan

# ── Rename the folder: prism-Website → tesseract-website ─────────────────────
Write-Host "`nRenaming folders..." -ForegroundColor Cyan

$prismWebsite = Join-Path $rootDir "prism-Website"
$tesseractWebsite = Join-Path $rootDir "tesseract-website"
if (Test-Path $prismWebsite) {
    Rename-Item -Path $prismWebsite -NewName "tesseract-website" -ErrorAction SilentlyContinue
    Write-Host "  [RENAMED] prism-Website → tesseract-website" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] prism-Website not found (may already be renamed)" -ForegroundColor Yellow
}

# Also check Prism-Website (capital P)
$PrismWebsite = Join-Path $rootDir "Prism-Website"
$TesseractWebsite = Join-Path $rootDir "Tesseract-Website"
if (Test-Path $PrismWebsite) {
    Rename-Item -Path $PrismWebsite -NewName "Tesseract-Website" -ErrorAction SilentlyContinue
    Write-Host "  [RENAMED] Prism-Website → Tesseract-Website" -ForegroundColor Green
}

Write-Host "`nAll done! Tesseract rename complete." -ForegroundColor Magenta
Write-Host "Remember to:" -ForegroundColor Yellow
Write-Host "  1. git add -A && git commit -m 'chore: rename Prism/OnboardAI → Tesseract AI'" -ForegroundColor Yellow
Write-Host "  2. Update any Render/Vercel service names in their dashboards" -ForegroundColor Yellow
Write-Host "  3. Update environment variables referencing old URLs" -ForegroundColor Yellow
