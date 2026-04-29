# ── rename_to_ahaget.ps1 ──────────────────────────────────────────────────────
# Renames all Tesseract / Tesseract AI references → Ahaget / ahaget.ai
# Run from: d:\prism

$rootDir = "d:\prism"

# ── Replacement pairs (most specific first) ───────────────────────────────────
$replacements = @(
    # Full brand + domain
    [pscustomobject]@{ From = "Tesseract AI";          To = "Ahaget" },
    [pscustomobject]@{ From = "tesseract-ai";          To = "ahaget" },
    [pscustomobject]@{ From = "TESSERACT-AI";          To = "AHAGET" },
    [pscustomobject]@{ From = "tesseract.ai";          To = "ahaget.ai" },
    [pscustomobject]@{ From = "Tesseract.ai";          To = "ahaget.ai" },
    # Render / package compound names
    [pscustomobject]@{ From = "tesseract-backend";     To = "ahaget-backend" },
    [pscustomobject]@{ From = "tesseract-dashboard";   To = "ahaget-dashboard" },
    [pscustomobject]@{ From = "tesseract-landing";     To = "ahaget-landing" },
    [pscustomobject]@{ From = "tesseract-db";          To = "ahaget-db" },
    [pscustomobject]@{ From = "tesseract-website";     To = "ahaget-website" },
    [pscustomobject]@{ From = "tesseract_website";     To = "ahaget_website" },
    # Bare name variants
    [pscustomobject]@{ From = "Tesseract";             To = "Ahaget" },
    [pscustomobject]@{ From = "tesseract";             To = "ahaget" },
    [pscustomobject]@{ From = "TESSERACT";             To = "AHAGET" }
)

# ── File extensions to process ────────────────────────────────────────────────
$extensions = @(
    "*.ts","*.tsx","*.js","*.jsx",
    "*.json","*.yaml","*.yml",
    "*.md","*.css","*.html","*.txt",
    "*.env","*.env.example","*.env.local"
)

# ── Folders to skip ───────────────────────────────────────────────────────────
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
        if (-not (ShouldSkip $f.FullName)) { $allFiles += $f }
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
Write-Host "`nContent replacements done: $changedCount files updated." -ForegroundColor Cyan

# ── Rename folder: tesseract-website → ahaget-website ────────────────────────
Write-Host "`nRenaming folders..." -ForegroundColor Cyan

$oldFolder = Join-Path $rootDir "tesseract-website"
$newFolder = Join-Path $rootDir "ahaget-website"
if (Test-Path $oldFolder) {
    Rename-Item -Path $oldFolder -NewName "ahaget-website" -ErrorAction SilentlyContinue
    Write-Host "  [RENAMED] tesseract-website → ahaget-website" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] tesseract-website not found" -ForegroundColor Yellow
}

Write-Host "`nAll done! Ahaget rename complete." -ForegroundColor Magenta
Write-Host "Remember to:" -ForegroundColor Yellow
Write-Host "  1. git add -A && git commit" -ForegroundColor Yellow
Write-Host "  2. Update Render/Vercel service names manually" -ForegroundColor Yellow
Write-Host "  3. Update any domain/env vars to ahaget.ai" -ForegroundColor Yellow
