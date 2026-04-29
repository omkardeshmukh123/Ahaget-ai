# ── fix_prisma_corruption.ps1 ─────────────────────────────────────────────────
# Restores 'prisma' (ORM tool) that was incorrectly renamed to 'tesseracta'
# Run from: d:\prism

$rootDir = "d:\prism"

$replacements = @(
    # Restore ORM-specific patterns (import paths, CLI, decorators, etc.)
    [pscustomobject]@{ From = "@tesseracta/client";         To = "@prisma/client" },
    [pscustomobject]@{ From = "npx tesseracta";             To = "npx prisma" },
    [pscustomobject]@{ From = "tesseracta generate";        To = "prisma generate" },
    [pscustomobject]@{ From = "tesseracta migrate";         To = "prisma migrate" },
    [pscustomobject]@{ From = "tesseracta deploy";          To = "prisma deploy" },
    [pscustomobject]@{ From = "tesseracta studio";          To = "prisma studio" },
    [pscustomobject]@{ From = "tesseracta db";              To = "prisma db" },
    [pscustomobject]@{ From = "tesseracta seed";            To = "prisma seed" },
    [pscustomobject]@{ From = "tesseracta format";          To = "prisma format" },
    [pscustomobject]@{ From = "tesseracta validate";        To = "prisma validate" },
    [pscustomobject]@{ From = "tesseracta introspect";      To = "prisma introspect" },
    # Package names
    [pscustomobject]@{ From = '"tesseracta"';               To = '"prisma"' },
    [pscustomobject]@{ From = '"@tesseracta/client"';       To = '"@prisma/client"' },
    [pscustomobject]@{ From = "'@tesseracta/client'";       To = "'@prisma/client'" },
    # Import statements
    [pscustomobject]@{ From = "from '@tesseracta/client'";  To = "from '@prisma/client'" },
    [pscustomobject]@{ From = 'from "@tesseracta/client"';  To = 'from "@prisma/client"' },
    [pscustomobject]@{ From = "require('@tesseracta/client')"; To = "require('@prisma/client')" },
    [pscustomobject]@{ From = 'require("@tesseracta/client")'; To = 'require("@prisma/client")' },
    # PrismaClient class name  
    [pscustomobject]@{ From = "TesseractaClient";           To = "PrismaClient" },
    [pscustomobject]@{ From = "new Tesseracta()";           To = "new PrismaClient()" },
    # Prisma namespace/type references
    [pscustomobject]@{ From = "Tesseracta.";                To = "Prisma." },
    [pscustomobject]@{ From = "Tesseracta,";                To = "Prisma," },
    [pscustomobject]@{ From = "Tesseracta }";               To = "Prisma }" },
    [pscustomobject]@{ From = "{ Tesseracta";               To = "{ Prisma" },
    # Script references in package.json
    [pscustomobject]@{ From = '"tesseracta"';               To = '"prisma"' },
    [pscustomobject]@{ From = '"tesseracta ';               To = '"prisma ' },
    [pscustomobject]@{ From = "tesseracta:";                To = "prisma:" },
    # lib/prisma.ts filename reference  
    [pscustomobject]@{ From = "lib/tesseracta";             To = "lib/prisma" },
    [pscustomobject]@{ From = "./lib/tesseracta";           To = "./lib/prisma" },
    [pscustomobject]@{ From = "../lib/tesseracta";          To = "../lib/prisma" },
    # Catch-all: standalone tesseracta word in code context (not brand name)
    [pscustomobject]@{ From = " tesseracta ";               To = " prisma " },
    [pscustomobject]@{ From = "(tesseracta)";               To = "(prisma)" },
    [pscustomobject]@{ From = 'tesseracta`';                To = 'prisma`' }
)

$extensions = @("*.ts","*.tsx","*.js","*.jsx","*.json","*.yaml","*.yml","*.md","*.env","*.env.example")
$skipDirNames = @(".git","node_modules","dist",".next","out",".planning",".worktrees")

function ShouldSkip($path) {
    foreach ($d in $skipDirNames) {
        if ($path -like "*\$d\*" -or $path -like "*\$d") { return $true }
    }
    return $false
}

$allFiles = @()
foreach ($ext in $extensions) {
    $found = Get-ChildItem -Path $rootDir -Recurse -Filter $ext -File -ErrorAction SilentlyContinue
    foreach ($f in $found) {
        if (-not (ShouldSkip $f.FullName)) { $allFiles += $f }
    }
}
$allFiles = $allFiles | Sort-Object FullName -Unique

Write-Host "Scanning $($allFiles.Count) files for tesseracta corruption..." -ForegroundColor Cyan

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
            Write-Host "  [FIXED] $rel" -ForegroundColor Green
            $changedCount++
        }
    } catch {
        Write-Host "  [ERROR] $($file.FullName): $_" -ForegroundColor Red
    }
}

Write-Host "`nDone. $changedCount files fixed." -ForegroundColor Magenta
