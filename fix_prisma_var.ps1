# ── fix_prisma_var.ps1 ────────────────────────────────────────────────────────
# Restores 'prisma' as a variable/instance name in TypeScript code
# that was incorrectly renamed to 'tesseracta' (PrismaClient instance)

$rootDir = "d:\prism"

# These are all the patterns where 'prisma' is used as a variable/instance
$replacements = @(
    # PrismaClient usage patterns (instance.method calls)
    'tesseracta.$',
    'tesseracta.user',
    'tesseracta.organization',
    'tesseracta.conversation',
    'tesseracta.message',
    'tesseracta.event',
    'tesseracta.endUser',
    'tesseracta.onboardingFlow',
    'tesseracta.onboardingStep',
    'tesseracta.userOnboardingSession',
    'tesseracta.escalationTicket',
    'tesseracta.followUpConfig',
    'tesseracta.knowledgeBaseArticle',
    'tesseracta.mcpConnector',
    'tesseracta.checklistStep',
    'tesseracta.billingSubscription',
    'tesseracta.widgetConfig',
    'tesseracta.apiKey',
    'tesseracta.auditLog',
    'tesseracta.plan',
    'tesseracta.customization',
    'tesseracta.branding',
    'tesseracta.activation',
    'tesseracta.session',
    'tesseracta.flowAlert',
    'tesseracta.failureLog'
)

$extensions = @("*.ts","*.tsx","*.js","*.jsx")
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

Write-Host "Scanning $($allFiles.Count) files..." -ForegroundColor Cyan

$changedCount = 0
foreach ($file in $allFiles) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $newContent = $content
        foreach ($from in $replacements) {
            $to = $from.Replace('tesseracta.', 'prisma.')
            $newContent = $newContent.Replace($from, $to)
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

# Show remaining hits
Write-Host "`nRemaining tesseracta occurrences in src:" -ForegroundColor Yellow
Get-ChildItem -Path "$rootDir\apps\backend\src" -Recurse -Filter "*.ts" | ForEach-Object {
    $c = [System.IO.File]::ReadAllText($_.FullName)
    if ($c -match 'tesseracta') {
        Write-Host "  STILL HAS: $($_.FullName.Substring($rootDir.Length + 1))" -ForegroundColor Red
    }
}
Write-Host "Scan complete." -ForegroundColor Cyan
