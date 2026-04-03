import axios from 'axios';

/**
 * Telegram Bot Service
 * Відправляє повідомлення в Telegram через Bot API
 *
 * Використання:
 * - notifyNewOrder(order) - нове замовлення
 * - notifyOrderCancelled(order) - замовлення скасовано
 * - notifyNewUser(user) - новий користувач
 * - sendTelegramMessage(text) - довільне повідомлення
 */

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

/**
 * Отримуємо облікові дані Telegram динамічно
 * (щоб dotenv встиг завантажитись)
 */
function getTelegramConfig(): { botToken: string | undefined; chatId: string | undefined } {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  };
}

/**
 * Відправити довільне повідомлення в Telegram
 */
export async function sendTelegramMessage(text: string, options?: {
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disableNotification?: boolean;
}): Promise<boolean> {
  const { botToken, chatId } = getTelegramConfig();

  if (!botToken || !chatId) {
    console.warn('⚠️ Telegram credentials not configured. Skipping notification.');
    return false;
  }

  try {
    const response = await axios.post(
      `${TELEGRAM_API_URL}${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode || 'HTML',
        disable_notification: options?.disableNotification || false,
      },
      {
        timeout: 10000, // 10 секунд таймаут
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.ok) {
      console.log('✅ Telegram message sent successfully');
      return true;
    }

    console.error('❌ Telegram API error:', response.data);
    return false;
  } catch (error: any) {
    // Не кидаємо помилку - повідомлення не критичне для основного потоку
    if (axios.isAxiosError(error)) {
      console.error('❌ Telegram notification failed:', error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
    } else {
      console.error('❌ Telegram notification error:', error);
    }
    return false;
  }
}

/**
 * Форматує ціну для відображення
 */
function formatPrice(price: number | string, currency = 'грн'): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `${numPrice.toFixed(2)} ${currency}`;
}

/**
 * Форматує дату для відображення
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Повідомлення про нове замовлення
 */
interface OrderNotificationData {
  id: string;
  orderNumber?: string | number;
  items: Array<{
    product: {
      title: string;
      [key: string]: any;
    };
    quantity: number;
    price: any;
  }>;
  totalPrice: any;
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  warehouse?: string | null;
  status?: string;
  createdAt?: Date | string;
}

export async function notifyNewOrder(order: OrderNotificationData): Promise<boolean> {
  const orderNumber = order.orderNumber || order.id.slice(0, 8).toUpperCase();
  
  // Формуємо список товарів
  const itemsList = order.items
    .map((item, index) => {
      const productName = item.product.title;
      const quantity = item.quantity;
      const price = formatPrice(item.price);
      return `<b>${index + 1}. ${productName}</b>
   Кількість: ${quantity} шт.
   Ціна: ${price}`;
    })
    .join('\n\n');

  const message = `📦 <b>Нове замовлення</b>

🆔 Номер: #${orderNumber}
📅 Дата: ${formatDate(order.createdAt || new Date())}

🛒 <b>Товари:</b>
${itemsList}

💰 <b>Загальна сума:</b> ${formatPrice(order.totalPrice)}

👤 Клієнт: ${order.name}
📞 Телефон: ${order.phone}${order.city ? `
📍 Місто: ${order.city}` : ''}${order.warehouse ? `
🚚 Відділення: ${order.warehouse}` : ''}

📊 Статус: ${order.status || 'NEW'}`;

  return sendTelegramMessage(message);
}

/**
 * Повідомлення про скасування замовлення
 */
export async function notifyOrderCancelled(order: OrderNotificationData): Promise<boolean> {
  const orderNumber = order.orderNumber || order.id.slice(0, 8).toUpperCase();

  const itemsList = order.items
    .map((item) => `${item.product.title} x${item.quantity}`)
    .join(', ');

  const message = `❌ <b>Замовлення скасовано</b>

🆔 Номер: #${orderNumber}
📅 Дата: ${formatDate(order.createdAt || new Date())}

🛒 Товари: ${itemsList}
💰 Сума: ${formatPrice(order.totalPrice)}

👤 Клієнт: ${order.name}
📞 Телефон: ${order.phone}`;

  return sendTelegramMessage(message, { parseMode: 'HTML' });
}

/**
 * Повідомлення про зміну статусу замовлення
 */
export async function notifyOrderStatusChanged(
  order: OrderNotificationData,
  oldStatus: string,
  newStatus: string
): Promise<boolean> {
  const orderNumber = order.orderNumber || order.id.slice(0, 8).toUpperCase();

  const statusEmoji: Record<string, string> = {
    NEW: '🆕',
    PROCESSING: '⚙️',
    SHIPPED: '🚚',
    DELIVERED: '✅',
    CANCELLED: '❌',
  };

  const emoji = statusEmoji[newStatus] || '📋';

  const message = `${emoji} <b>Статус замовлення змінено</b>

🆔 Номер: #${orderNumber}
🔄 ${oldStatus} → <b>${newStatus}</b>

👤 Клієнт: ${order.name}
💰 Сума: ${formatPrice(order.totalPrice)}`;

  return sendTelegramMessage(message, { parseMode: 'HTML' });
}

/**
 * Повідомлення про нового користувача
 */
interface UserNotificationData {
  id: string;
  email: string;
  role?: string;
  createdAt?: Date | string;
}

export async function notifyNewUser(user: UserNotificationData): Promise<boolean> {
  const message = `👤 <b>Новий користувач</b>

🆔 ID: ${user.id.slice(0, 8).toUpperCase()}
📧 Email: ${user.email}
📋 Роль: ${user.role || 'USER'}
📅 Дата: ${formatDate(user.createdAt || new Date())}`;

  return sendTelegramMessage(message, { parseMode: 'HTML' });
}

/**
 * Повідомлення про помилку в системі
 */
export async function notifySystemError(message: string, details?: string): Promise<boolean> {
  const text = `🚨 <b>Системна помилка</b>

${message}${details ? `

<details>${details}</details>` : ''}

⏰ Час: ${formatDate(new Date())}`;

  return sendTelegramMessage(text, { parseMode: 'HTML' });
}
