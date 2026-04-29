$files = Get-ChildItem -Path "D:\prism\prism-Website" -Recurse -Include "*.tsx","*.ts" |
  Where-Object { $_.FullName -notmatch "node_modules|\.next" }

foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
  $original = $content

  # URLs & domain
  $content = $content -replace 'useprism\.ai', 'usetesseract.ai'
  $content = $content -replace '@useprism', '@usetesseract'
  $content = $content -replace 'hello@useprism\.ai', 'hello@usetesseract.ai'

  # Code identifiers
  $content = $content -replace 'prism-settings', 'tesseract-settings'
  $content = $content -replace '@prism/agent', '@tesseract/agent'
  $content = $content -replace 'window\.prismSettings', 'window.tesseractSettings'
  $content = $content -replace 'Prism\.init', 'Tesseract.init'

  # Brand name - compound first
  $content = $content -replace 'Prism AI', 'Tesseract AI'
  $content = $content -replace 'prism AI', 'Tesseract AI'

  # Specific phrases
  $content = $content -replace 'Evaluating Prism', 'Evaluating Tesseract'
  $content = $content -replace 'exploring the Prism ecosystem', 'exploring the Tesseract ecosystem'
  $content = $content -replace "evaluating Prism", 'evaluating Tesseract'
  $content = $content -replace 'Can I use Prism', 'Can I use Tesseract'
  $content = $content -replace 'test Prism on', 'test Tesseract on'
  $content = $content -replace "you're evaluating Prism", "you're evaluating Tesseract"
  $content = $content -replace 'Deploy Prism', 'Deploy Tesseract'
  $content = $content -replace "Prism doesn't", "Tesseract doesn't"
  $content = $content -replace 'Prism fills', 'Tesseract fills'
  $content = $content -replace 'Prism guides', 'Tesseract guides'
  $content = $content -replace 'Prism watches', 'Tesseract watches'
  $content = $content -replace 'Prism can click', 'Tesseract can click'
  $content = $content -replace 'Prism is the', 'Tesseract is the'
  $content = $content -replace 'Prism Agent', 'Tesseract Agent'
  $content = $content -replace 'Prism Assistant', 'Tesseract Assistant'
  $content = $content -replace 'install Prism', 'install Tesseract'
  $content = $content -replace 'using Prism', 'using Tesseract'

  # Metadata strings
  $content = $content -replace '— Prism"', '— Tesseract AI"'
  $content = $content -replace 'siteName: "Prism"', 'siteName: "Tesseract AI"'
  $content = $content -replace 'title: "Prism', 'title: "Tesseract AI'

  # JSX text nodes - >Prism< 
  $content = $content -replace '>Prism<', '>Tesseract AI<'
  $content = $content -replace '"Prism"', '"Tesseract AI"'

  # Remaining standalone Prism (word boundary simulation)
  $content = $content -replace '\bPrism\b', 'Tesseract AI'

  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
    Write-Host "Updated: $($file.Name)"
  }
}

Write-Host "ALL DONE."
