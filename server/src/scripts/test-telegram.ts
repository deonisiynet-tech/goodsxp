/**
 * Тестовий скрипт для перевірки Telegram-уведомлень
 *
 * Запуск:
 *   npx tsx src/scripts/test-telegram.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Завантажуємо .env з кореня проекту
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import {
  sendTelegramMessage,
  notifyNewOrder,
  notifyOrderStatusChanged,
  notifyNewUser,
  notifySystemError,
} from '../services/telegram.service.js';

async function main() {
  console.log('='.repeat(50));
  console.log('🧪 TELEGRAM NOTIFICATION TEST');
  console.log('='.repeat(50));

  // Перевірка конфігурації
  console.log('\n📋 Перевірка конфігурації:');
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  console.log(`   TELEGRAM_BOT_TOKEN: ${botToken ? '✅ Встановлено' : '❌ НЕ встановлено!'}`);
  console.log(`   TELEGRAM_CHAT_ID: ${chatId ? '✅ Встановлено' : '❌ НЕ встановлено!'}`);

  if (!botToken || !chatId) {
    console.error('\n❌ Помилка: Змінні оточення не налаштовані!');
    console.error('   Додайте в .env:');
    console.error('   TELEGRAM_BOT_TOKEN=your_token');
    console.error('   TELEGRAM_CHAT_ID=your_chat_id');
    process.exit(1);
  }

  // Перевірка токену через getMe
  console.log('\n🔍 Перевірка токену бота...');
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json() as any;

    if (data.ok) {
      console.log(`   ✅ Бот знайдений: @${data.result.username}`);
      console.log(`   📛 Ім'я: ${data.result.first_name}`);
      console.log(`   🆔 ID: ${data.result.id}`);
    } else {
      console.error(`   ❌ Помилка: ${data.description}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`   ❌ Не вдалося підключитися: ${error.message}`);
    process.exit(1);
  }

  // Перевірка Chat ID через getChat
  console.log('\n🔍 Перевірка Chat ID...');
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getChat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId }),
    });
    const data = await response.json() as any;

    if (data.ok) {
      console.log(`   ✅ Chat знайдений: ${data.result.first_name || data.result.title || 'Unknown'}`);
      console.log(`   📝 Тип: ${data.result.type}`);
      console.log(`   🆔 ID: ${data.result.id}`);
    } else {
      console.error(`   ❌ Помилка: ${data.description}`);
      console.error(`   💡 Переконайтеся, що ви написали боту /start`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`   ❌ Не вдалося перевірити Chat ID: ${error.message}`);
    process.exit(1);
  }

  // Тест 1: Просте повідомлення
  console.log('\n📤 Тест 1: Просте повідомлення...');
  const result1 = await sendTelegramMessage(
    '🧪 <b>Тестове повідомлення</b>\n\nЦе тестове повідомлення для перевірки роботи Telegram-сервісу.'
  );
  console.log(`   ${result1 ? '✅' : '❌'} Результат: ${result1 ? 'Надіслано' : 'Помилка'}`);

  // Тест 2: Нове замовлення
  console.log('\n📤 Тест 2: Повідомлення про нове замовлення...');
  const result2 = await notifyNewOrder({
    id: 'test-order-12345',
    orderNumber: 'TEST001',
    items: [
      {
        product: { title: 'Тестовий товар 1' },
        quantity: 2,
        price: 250.0,
      },
      {
        product: { title: 'Тестовий товар 2' },
        quantity: 1,
        price: 500.0,
      },
    ],
    totalPrice: 1000.0,
    name: 'Тестовий клієнт',
    phone: '+380501234567',
    city: 'Київ',
    warehouse: 'Відділення №1',
    status: 'NEW',
    createdAt: new Date(),
  });
  console.log(`   ${result2 ? '✅' : '❌'} Результат: ${result2 ? 'Надіслано' : 'Помилка'}`);

  // Тест 3: Зміна статусу
  console.log('\n📤 Тест 3: Повідомлення про зміну статусу...');
  const result3 = await notifyOrderStatusChanged(
    {
      id: 'test-order-12345',
      orderNumber: 'TEST001',
      items: [{ product: { title: 'Тестовий товар' }, quantity: 1, price: 500.0 }],
      totalPrice: 500.0,
      name: 'Тестовий клієнт',
      phone: '+380501234567',
      status: 'PROCESSING',
    },
    'NEW',
    'PROCESSING'
  );
  console.log(`   ${result3 ? '✅' : '❌'} Результат: ${result3 ? 'Надіслано' : 'Помилка'}`);

  // Тест 4: Новий користувач
  console.log('\n📤 Тест 4: Повідомлення про нового користувача...');
  const result4 = await notifyNewUser({
    id: 'test-user-67890',
    email: 'test@example.com',
    role: 'USER',
    createdAt: new Date(),
  });
  console.log(`   ${result4 ? '✅' : '❌'} Результат: ${result4 ? 'Надіслано' : 'Помилка'}`);

  // Тест 5: Системна помилка
  console.log('\n📤 Тест 5: Повідомлення про системну помилку...');
  const result5 = await notifySystemError(
    'Тестова помилка',
    'Це тестова помилка для перевірки системи сповіщень'
  );
  console.log(`   ${result5 ? '✅' : '❌'} Результат: ${result5 ? 'Надіслано' : 'Помилка'}`);

  // Підсумок
  console.log('\n' + '='.repeat(50));
  const allPassed = result1 && result2 && result3 && result4 && result5;
  if (allPassed) {
    console.log('✅ ВСІ ТЕСТИ ПРОЙДЕНІ! Telegram-сповіщення працюють.');
  } else {
    console.log('⚠️  Деякі тести не пройдені. Перевірте логи вище.');
  }
  console.log('='.repeat(50));
}

main().catch((error) => {
  console.error('❌ Критична помилка:', error);
  process.exit(1);
});
