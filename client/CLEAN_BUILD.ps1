# 🧹 Очищення кешу і збірка (PowerShell)

Write-Host "🧹 Очищення Next.js cache..." -ForegroundColor Cyan
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

Write-Host "📦 Перевстановлення залежностей..." -ForegroundColor Cyan
npm install

Write-Host "🏗️  Збірка проекту..." -ForegroundColor Cyan
npm run build

Write-Host "✅ Готово!" -ForegroundColor Green
