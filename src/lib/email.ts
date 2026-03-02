import { formatPrice } from './format';

type ReceiptInput = {
  orderId: string;
  customerEmail: string;
  customerName?: string;
  branchName: string;
  branchAddress: string;
  createdAt: string;
  items: Array<{ title_snapshot: string; qty: number; unit_price_kzt: number }>;
};

export const buildReceiptHtml = (data: ReceiptInput) => {
  const items = data.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;color:#111827;">${item.title_snapshot}</td><td style="padding:8px 0;color:#6b7280;">${item.qty}×</td><td style="padding:8px 0;text-align:right;color:#111827;">${formatPrice(item.qty * item.unit_price_kzt)}</td></tr>`,
    )
    .join('');
  const total = data.items.reduce((sum, item) => sum + item.qty * item.unit_price_kzt, 0);

  return `
  <div style="font-family:Inter,-apple-system,Segoe UI,sans-serif;background:#fafafa;padding:24px;color:#111827;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;">
      <h1 style="font-size:24px;margin:0 0 8px;">SmartShop · Чек по заказу</h1>
      <p style="margin:0 0 16px;color:#4b5563;">Заказ #${data.orderId.slice(0, 8)} от ${new Date(data.createdAt).toLocaleString('ru-RU')}</p>
      <p style="margin:0 0 16px;color:#4b5563;">Филиал: ${data.branchName}, ${data.branchAddress}</p>
      <table style="width:100%;border-collapse:collapse;">${items}</table>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
      <p style="margin:0;font-weight:600;font-size:18px;">Итого: ${formatPrice(total)}</p>
      <p style="margin:12px 0 0;color:#6b7280;">Спасибо за покупку${data.customerName ? ', ' + data.customerName : ''}.</p>
    </div>
  </div>`;
};

export const sendReceiptEmail = async ({ html, to, subject, text }: { html: string; to: string; subject: string; text: string }) => {
  const importer = new Function('moduleName', 'return import(moduleName)');
  const loaded = await importer('nodemailer').catch(() => null);

  if (!loaded?.default?.createTransport && !loaded?.createTransport) {
    throw new Error('nodemailer is not installed');
  }

  const createTransport = loaded.default?.createTransport ?? loaded.createTransport;

  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
};
