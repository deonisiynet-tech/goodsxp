# 🔒 Security: .env файли були в Git історії

## Проблема
`.env`, `.env.railway`, `client/.env.local` були закомічені в git історію **11 разів**.
Навіть якщо видалити їх зараз — вони залишаються в `git log`.

## Що було в історії
- `client/.env.local` — тільки `NEXT_PUBLIC_API_URL=/api` та `INTERNAL_API_URL=http://localhost:8080` — **без секретів**
- `server/.env.railway` — перевірте самостійно через `git log -p -- server/.env.railway`

## Якщо в історії були реальні секрети (DATABASE_URL, JWT_SECRET, Cloudinary keys):

### 1. ЗРОБИТИ РЕВОКАЦІЮ ВСІХ СЕКРЕТІВ НЕГАЙНО
- **DATABASE_URL** — змінити пароль PostgreSQL
- **JWT_SECRET** — згенерувати новий, всі користувачі вийдуть
- **CLOUDINARY_API_KEY/SECRET** — перегенерувати в Cloudinary dashboard
- **NOVA_POSHTA_API_KEY** — перегенерувати в кабінеті НП
- **TELEGRAM_BOT_TOKEN** — створити нового бота через @BotFather

### 2. Очистити git історію (ОПЦІОНАЛЬНО, але рекомендовано)

```bash
# Встановити BFG Repo-Cleaner
# https://rtyley.github.io/bfg-repo-cleaner/

# Видалити всі .env файли з історії
bfg --delete-files .env
bfg --delete-files .env.railway
bfg --delete-files client/.env.local
bfg --delete-files server/.env

# Force push
git push --force --all
git push --force --tags
```

### 3. Альтернатива — git filter-branch
```bash
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch -- .env server/.env server/.env.railway client/.env.local' \
  --prune-empty --tag-name-filter cat -- --all
```

## Поточний стан
✅ `.gitignore` оновлено — тепер ігнорує ВСІ `.env` файли
✅ `.env` файли видалені з git індексу
⚠️ Файли залишаються в `git log` — якщо були секрети, **зробіть ревокацію**

## Запобігти в майбутньому
Додати pre-commit hook:
```bash
#!/bin/bash
# .git/hooks/pre-commit
if git diff --cached --name-only | grep -qE '\.env$|\.env\.'; then
  echo "❌ BLOCKED: .env files cannot be committed!"
  exit 1
fi
```
