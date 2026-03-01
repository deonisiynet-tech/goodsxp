# 🚀 Швидка інструкція запуску

## Крок 1: Встановіть PostgreSQL

Якщо ще не встановлено:
- Завантажте: https://www.postgresql.org/download/windows/
- Встановіть версію 15 або 16
- **Запам'ятайте пароль** для користувача `postgres`

## Крок 2: Налаштуйте .env

Відкрийте `server\.env` та змініть:

```env
DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/shop_db?schema=public"
```

Замініть `ВАШ_ПАРОЛЬ` на пароль який ви задали при встановленні PostgreSQL.

## Крок 3: Ініціалізуйте базу даних

Відкрийте PowerShell в папці проекту та виконайте по черзі:

```bash
# Перейдіть в папку сервера
cd server

# Встановіть залежності (якщо ще не встановлені)
npm install

# Створіть базу даних
npx prisma migrate dev --name init

# Створіть адміна та тестові товари
npm run seed
```

**Якщо бачите помилку підключення до бази даних:**
- Перевірте що PostgreSQL запущений (services.msc → postgresql-x64-15)
- Перевірте пароль у DATABASE_URL

## Крок 4: Запустіть проект

З кореневої папки:

```bash
npm run dev
```

Це запустить:
- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:3000

## Крок 5: Увійдіть в адмінку

1. Відкрийте: http://localhost:3000/admin
2. Введіть:
   - **Email:** `admin@shop.com`
   - **Пароль:** `Admin123!`

---

## 🔧 Вирішення проблем

### Помилка "Prisma Client not generated"
```bash
cd server
npx prisma generate
```

### Помилка "Database connection failed"
1. Перевірте що PostgreSQL запущений
2. Перевірте пароль у `server\.env`
3. Спробуйте створити базу вручну:
   ```bash
   psql -U postgres
   CREATE DATABASE shop_db;
   \q
   ```

### Помилка "User not found" або "Wrong password"
Перезапустіть seed:
```bash
cd server
npm run seed
```

### Помилка "Module not found"
Встановіть залежності:
```bash
cd server && npm install
cd ../client && npm install
```

---

## ✅ Все працює!

Якщо все налаштовано правильно:
- ✅ Сайт відкривається на http://localhost:3000
- ✅ Адмінка відкривається на http://localhost:3000/admin
- ✅ Вхід в адмінку працює з admin@shop.com / Admin123!
- ✅ Товари відображаються в каталозі
- ✅ Можна додавати/редагувати/видаляти товари

---

## 📞 Контакти для підтримки

- Email: support@goodsxp.store
- Telegram: @goodsxp
