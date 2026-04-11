import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

// Create transporter (only when SMTP is configured)
const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const resendConfigured = Boolean(process.env.RESEND_API_KEY);
if (resendConfigured) {
  console.log("✓ Resend email API enabled");
}

if (transporter) {
  transporter
    .verify()
    .then(() => console.log("✓ SMTP transport ready"))
    .catch((err) => console.error("✗ SMTP transport error:", err.message));
}

// Owner emails (comma-separated)
const getOwnerEmails = () => {
  const emails = process.env.OWNER_EMAILS || process.env.SMTP_USER || "";
  return emails
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
};
const OWNER_NAME = process.env.OWNER_NAME || "Hrishika";
const SHOP_NAME = process.env.SHOP_NAME || "HriCochets";

const getFromAddress = () => {
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  return fromEmail ? `"${SHOP_NAME}" <${fromEmail}>` : undefined;
};

const normalizeToList = (to) => {
  if (Array.isArray(to)) return to;
  return String(to)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
};

const sendWithResend = async ({ from, to, subject, html }) => {
  const payload = {
    from,
    to: normalizeToList(to),
    subject,
    html,
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return { messageId: data?.id };
};

const sendEmail = async (mailOptions) => {
  const from = mailOptions.from || getFromAddress();
  if (!from) {
    throw new Error("Email sender address is not configured");
  }

  if (resendConfigured) {
    return sendWithResend({ ...mailOptions, from });
  }

  if (transporter) {
    return transporter.sendMail({ ...mailOptions, from });
  }

  throw new Error("No email transport configured (set RESEND_API_KEY or SMTP_*)");
};

// ==================== USER EMAILS ====================

// Send welcome email after signup
export async function sendWelcomeEmail(user) {
  const mailOptions = {
    from: getFromAddress(),
    to: user.email,
    subject: `Welcome to ${SHOP_NAME}! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #053641 0%, #042830 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #053641; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${SHOP_NAME}! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.name}! 👋</h2>
            <p>Thank you for creating an account with us! We're excited to have you join our community.</p>
            
            <p><strong>Your Account Details:</strong></p>
            <ul>
              <li>Name: ${user.name}</li>
              <li>Email: ${user.email}</li>
              ${user.phone ? `<li>Phone: ${user.phone}</li>` : ''}
            </ul>

            <p>You can now:</p>
            <ul>
              <li>✅ Browse our handcrafted products</li>
              <li>✅ Place orders with ease</li>
              <li>✅ Track your order history</li>
              <li>✅ Request custom designs</li>
            </ul>

            <center>
              <a href="${process.env.FRONTEND_URL}" class="button">Start Shopping</a>
            </center>

            <p>If you have any questions, feel free to reply to this email.</p>
            
            <p>Happy shopping! 🛍️</p>
            <p><strong>The ${SHOP_NAME} Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${SHOP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sendEmail(mailOptions);
    console.log(`✓ Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error(`✗ Failed to send welcome email to ${user.email}:`, error.message);
  }
}

// Send login notification
export async function sendLoginNotification(user) {
  const mailOptions = {
    from: getFromAddress(),
    to: user.email,
    subject: `Login detected on your ${SHOP_NAME} account`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #053641; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #053641; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔐 Account Login Detected</h2>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>We detected a login to your ${SHOP_NAME} account.</p>
            
            <div class="info-box">
              <p><strong>Login Details:</strong></p>
              <p>📧 Email: ${user.email}</p>
              <p>⏰ Time: ${new Date().toLocaleString()}</p>
            </div>

            <p>If this was you, you can safely ignore this email.</p>
            <p>If you didn't log in, please contact us immediately to secure your account.</p>
            
            <p>Best regards,<br><strong>The ${SHOP_NAME} Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sendEmail(mailOptions);
    console.log(`✓ Login notification sent to ${user.email}`);
  } catch (error) {
    console.error(`✗ Failed to send login notification:`, error.message);
  }
}

// Send order confirmation to customer
export async function sendOrderConfirmation(order, customerEmail) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">
        <strong>${item.name}</strong><br>
        ${item.color ? `Color: ${item.color}<br>` : ''}
        ${item.size ? `Size: ${item.size}<br>` : ''}
        Qty: ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
        Rs.${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const mailOptions = {
    from: getFromAddress(),
    to: customerEmail,
    subject: `Order Confirmation - ${order.id} 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #A3FFC2 0%, #C6E7FF 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-id { background: #053641; color: white; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; border-radius: 8px; margin: 20px 0; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; background: white; margin: 20px 0; }
          .total-row { background: #053641; color: white; font-weight: bold; }
          .address-box { background: white; padding: 15px; border-left: 4px solid #053641; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Order Confirmed!</h1>
            <p>Thank you for your order!</p>
          </div>
          <div class="content">
            <h2>Hi ${order.shippingAddress.fullName}! 👋</h2>
            <p>We've received your order and will start processing it soon.</p>
            
            <div class="order-id">
              Order ID: ${order.id}
            </div>

            <h3>📦 Order Summary</h3>
            <table>
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr>
                  <td style="padding: 10px; text-align: right;"><strong>Shipping:</strong></td>
                  <td style="padding: 10px; text-align: right;">Rs.10.00</td>
                </tr>
                <tr class="total-row">
                  <td style="padding: 15px; text-align: right;">TOTAL:</td>
                  <td style="padding: 15px; text-align: right;">Rs.${order.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <h3>🚚 Shipping Address</h3>
            <div class="address-box">
              <p>
                <strong>${order.shippingAddress.fullName}</strong><br>
                ${order.shippingAddress.addressLine1}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
                Phone: ${order.shippingAddress.phone}
              </p>
            </div>

            <h3>📬 What's Next?</h3>
            <ul>
              <li>✅ Order confirmed and received</li>
              <li>🎨 We'll start crafting your items</li>
              <li>📦 You'll receive a shipping notification when your order is dispatched</li>
              <li>🏠 Estimated delivery: 5-7 business days</li>
            </ul>

            <p>You can track your order status in your account dashboard.</p>
            
            <p style="margin-top: 30px;">
              If you have any questions about your order, feel free to reply to this email.
            </p>
            
            <p>Thank you for supporting our handcrafted creations! ❤️</p>
            <p><strong>The ${SHOP_NAME} Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sendEmail(mailOptions);
    console.log(`✓ Order confirmation sent to ${customerEmail}`);
  } catch (error) {
    console.error(`✗ Failed to send order confirmation:`, error.message);
  }
}

// Send custom order confirmation to customer
export async function sendCustomOrderConfirmation(customOrder) {
  const mailOptions = {
    from: getFromAddress(),
    to: customOrder.email,
    subject: `Custom Order Request Received - ${customOrder.request_id} 🎨`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF92C4 0%, #A3FFC2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .request-id { background: #053641; color: white; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; border-radius: 8px; margin: 20px 0; font-family: monospace; }
          .info-box { background: white; padding: 20px; border-left: 4px solid #FF92C4; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎨 Custom Order Request Received!</h1>
          </div>
          <div class="content">
            <h2>Hi ${customOrder.name}! 👋</h2>
            <p>Thank you for your custom order request! We're excited to bring your vision to life.</p>
            
            <div class="request-id">
              Request ID: ${customOrder.request_id}
            </div>

            <h3>📝 Your Request Details</h3>
            <div class="info-box">
              <p><strong>Description:</strong></p>
              <p>${customOrder.description}</p>
              ${customOrder.budget ? `<p><strong>Budget:</strong> Rs.${customOrder.budget}</p>` : ''}
              ${customOrder.urgency ? `<p><strong>Urgency:</strong> ${customOrder.urgency}</p>` : ''}
            </div>

            <h3>⏳ What Happens Next?</h3>
            <ol>
              <li><strong>Review (1-2 days):</strong> We'll carefully review your request</li>
              <li><strong>Quote:</strong> We'll send you a detailed quote with pricing and timeline</li>
              <li><strong>Approval:</strong> Once you approve, we'll start crafting</li>
              <li><strong>Creation:</strong> Your custom piece will be handmade with care</li>
              <li><strong>Delivery:</strong> We'll ship it directly to you!</li>
            </ol>

            <p style="background: #C6E7FF; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>💡 Pro Tip:</strong> We'll reach out within 24-48 hours to discuss your project in detail. 
              Keep an eye on your email!
            </p>

            <p>Have questions in the meantime? Just reply to this email!</p>
            
            <p>We can't wait to create something special for you! ✨</p>
            <p><strong>The ${SHOP_NAME} Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sendEmail(mailOptions);
    console.log(`✓ Custom order confirmation sent to ${customOrder.email}`);
  } catch (error) {
    console.error(`✗ Failed to send custom order confirmation:`, error.message);
  }
}

// ==================== OWNER EMAILS ====================

// Send new order notification to owner
export async function sendOwnerOrderNotification(order, customerEmail) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.color || '-'}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.size || '-'}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">Rs.${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: getFromAddress() ? getFromAddress().replace(`"${SHOP_NAME}"`, `"${SHOP_NAME} System"`) : undefined,
    to: getOwnerEmails().join(','),
    replyTo: customerEmail,
    subject: `🔔 NEW ORDER: ${order.id} - Rs.${order.total.toFixed(2)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: #053641; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .alert-box { background: #A3FFC2; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; margin: 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          table { width: 100%; border-collapse: collapse; background: white; margin: 15px 0; }
          th { background: #053641; color: white; padding: 10px; text-align: left; }
          .info-section { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #053641; }
          .total { background: #053641; color: white; padding: 15px; font-size: 24px; text-align: center; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ NEW ORDER RECEIVED</h1>
          </div>
          <div class="alert-box">
            Order ID: ${order.id}
          </div>
          <div class="content">
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>

            <div class="info-section">
              <h3>👤 Customer Information</h3>
              <p>
                <strong>Name:</strong> ${order.shippingAddress.fullName}<br>
                <strong>Email:</strong> ${customerEmail}<br>
                <strong>Phone:</strong> ${order.shippingAddress.phone}
              </p>
            </div>

            <div class="info-section">
              <h3>🚚 Shipping Address</h3>
              <p>
                ${order.shippingAddress.fullName}<br>
                ${order.shippingAddress.addressLine1}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
                Phone: ${order.shippingAddress.phone}
              </p>
            </div>

            <h3>📦 Order Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Color</th>
                  <th>Size</th>
                  <th style="text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="total">
              💰 TOTAL: Rs.${order.total.toFixed(2)}
            </div>

            <div style="background: #C6E7FF; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p><strong>⚡ Action Required:</strong></p>
              <ol>
                <li>Log in to your admin panel to process this order</li>
                <li>Prepare the items for crafting/shipping</li>
                <li>Update order status when ready</li>
              </ol>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sendEmail(mailOptions);
    console.log(`✓ Owner notification sent for order ${order.id}`);
  } catch (error) {
    console.error(`✗ Failed to send owner notification:`, error.message);
  }
}

// Send custom order request to owner
export async function sendOwnerCustomOrderNotification(customOrder) {
  const mailOptions = {
    from: getFromAddress() ? getFromAddress().replace(`"${SHOP_NAME}"`, `"${SHOP_NAME} System"`) : undefined,
    to: getOwnerEmails().join(','),
    replyTo: customOrder.email,
    subject: `🎨 NEW CUSTOM ORDER REQUEST: ${customOrder.request_id}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: #FF92C4; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .alert-box { background: #A3FFC2; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; margin: 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-left: 4px solid #FF92C4; margin: 20px 0; }
          .urgent { background: #ff4444; color: white; padding: 10px; text-align: center; border-radius: 8px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎨 NEW CUSTOM ORDER REQUEST</h1>
          </div>
          <div class="alert-box">
            Request ID: ${customOrder.request_id}
          </div>
          <div class="content">
            <p><strong>Received:</strong> ${new Date().toLocaleString()}</p>
            
            ${customOrder.urgency === 'urgent' ? '<div class="urgent">⚠️ URGENT REQUEST</div>' : ''}

            <div class="info-box">
              <h3>👤 Customer Details</h3>
              <p>
                <strong>Name:</strong> ${customOrder.name}<br>
                <strong>Email:</strong> ${customOrder.email}<br>
                <strong>Phone:</strong> ${customOrder.phone || 'Not provided'}
              </p>
            </div>

            <div class="info-box">
              <h3>📝 Request Description</h3>
              <p style="white-space: pre-wrap;">${customOrder.description}</p>
            </div>

            <div class="info-box">
              <h3>💰 Budget & Timeline</h3>
              <p>
                <strong>Budget:</strong> ${customOrder.budget ? `Rs.${customOrder.budget}` : 'Not specified'}<br>
                <strong>Urgency:</strong> ${customOrder.urgency === 'urgent' ? '🔴 URGENT' : '🟢 Normal'}
              </p>
            </div>

            <div style="background: #C6E7FF; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p><strong>⚡ Action Required:</strong></p>
              <ol>
                <li>Review the custom order request</li>
                <li>Contact customer to discuss details: ${customOrder.email}</li>
                <li>Prepare and send a quote</li>
                <li>Update request status in admin panel</li>
              </ol>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:${customOrder.email}?subject=Re: Custom Order Request ${customOrder.request_id}" 
                 style="display: inline-block; background: #053641; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px;">
                Reply to Customer
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sendEmail(mailOptions);
    console.log(`✓ Owner notification sent for custom order ${customOrder.request_id}`);
  } catch (error) {
    console.error(`✗ Failed to send owner custom order notification:`, error.message);
  }
}

// Send new signup notification to owner
export async function sendOwnerNewUserNotification(user) {
  const mailOptions = {
    from: getFromAddress() ? getFromAddress().replace(`"${SHOP_NAME}"`, `"${SHOP_NAME} System"`) : undefined,
    to: getOwnerEmails().join(','),
    replyTo: user.email,
    subject: `👤 New User Signup: ${user.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #053641; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { background: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 8px; }
          .user-info { background: white; padding: 15px; border-left: 4px solid #A3FFC2; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>👤 New User Registered</h2>
          </div>
          <div class="content">
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            
            <div class="user-info">
              <h3>User Details</h3>
              <p>
                <strong>Name:</strong> ${user.name}<br>
                <strong>Email:</strong> ${user.email}<br>
                <strong>Phone:</strong> ${user.phone || 'Not provided'}<br>
                <strong>User ID:</strong> ${user.id}
              </p>
            </div>

            <p>A new customer has joined ${SHOP_NAME}! 🎉</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sendEmail(mailOptions);
    console.log(`✓ Owner notified of new user: ${user.email}`);
  } catch (error) {
    console.error(`✗ Failed to send owner new user notification:`, error.message);
  }
}

// ==================== ORDER CANCELLATION EMAILS ====================

// Send order cancellation confirmation to customer
export async function sendOrderCancellationEmail(order, customerEmail) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">
        <strong>${item.name}</strong><br>
        ${item.color ? `Color: ${item.color}<br>` : ''}
        ${item.size ? `Size: ${item.size}<br>` : ''}
        Qty: ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
        Rs.${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const mailOptions = {
    from: getFromAddress(),
    to: customerEmail,
    subject: `Order Cancelled - ${order.id} ❌`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-id { background: #dc3545; color: white; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; border-radius: 8px; margin: 20px 0; font-family: monospace; }
          .cancelled-badge { background: #dc3545; color: white; padding: 8px 20px; border-radius: 20px; display: inline-block; font-size: 14px; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; background: white; margin: 20px 0; }
          .refund-box { background: #C6E7FF; padding: 20px; border-left: 4px solid #053641; margin: 20px 0; border-radius: 5px; }
          .address-box { background: white; padding: 15px; border-left: 4px solid #999; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Cancelled</h1>
          </div>
          <div class="content">
            <h2>Hi ${order.shippingAddress.fullName}! 👋</h2>
            <p>Your order has been successfully cancelled as requested.</p>
            
            <div style="text-align: center;">
              <span class="cancelled-badge">✕ ORDER CANCELLED</span>
            </div>

            <div class="order-id">
              Order ID: ${order.id}
            </div>

            <table style="width: 100%; margin: 20px 0;">
              <tr style="background: #f0f0f0;">
                <td style="padding: 10px;"><strong>Order Date:</strong></td>
                <td style="padding: 10px; text-align: right;">${new Date(order.date).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</td>
              </tr>
              <tr>
                <td style="padding: 10px;"><strong>Cancellation Date:</strong></td>
                <td style="padding: 10px; text-align: right;">${new Date().toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</td>
              </tr>
              <tr style="background: #f0f0f0;">
                <td style="padding: 10px;"><strong>Total Amount:</strong></td>
                <td style="padding: 10px; text-align: right;"><strong>Rs.${order.total.toFixed(2)}</strong></td>
              </tr>
            </table>

            <h3>📦 Cancelled Items</h3>
            <table>
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="refund-box">
              <h3 style="margin-top: 0; color: #053641;">💳 Refund Information</h3>
              <p>If you have already made a payment for this order, a refund will be processed within <strong>5-7 business days</strong>.</p>
              <p>The amount will be credited back to your original payment method.</p>
              <p>You will receive a confirmation email once the refund is processed.</p>
            </div>

            <div class="address-box">
              <h4 style="margin-top: 0; color: #666;">📍 Shipping Address (Cancelled)</h4>
              <p style="margin: 0;">
                ${order.shippingAddress.fullName}<br>
                ${order.shippingAddress.addressLine1}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
                Phone: ${order.shippingAddress.phone}
              </p>
            </div>

            <p style="margin-top: 30px;">
              We're sorry to see this order cancelled. If you changed your mind or had any issues, 
              we'd love to hear from you. Your feedback helps us improve!
            </p>

            <p>If you have any questions about this cancellation, feel free to reply to this email.</p>
            
            <p>We hope to serve you again soon! 🛍️</p>
            <p><strong>The ${process.env.SHOP_NAME || 'HriCochets'} Team</strong></p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${process.env.SHOP_NAME || 'HriCochets'}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await sendEmail(mailOptions);
    console.log(`✓ Order cancellation email sent to ${customerEmail}`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`✗ Failed to send order cancellation email:`, error);
    return { success: false, error: error.message };
  }
}

// Send order cancellation notification to owner
export async function sendOwnerOrderCancellationNotification(order, customerEmail) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.color || '-'}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.size || '-'}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">Rs.${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const ownerEmails = getOwnerEmails();
  
  const mailOptions = {
    from: getFromAddress() ? getFromAddress().replace(`"${SHOP_NAME}"`, `"${SHOP_NAME} System"`) : undefined,
    to: ownerEmails.join(', '),
    replyTo: customerEmail,
    subject: `🚨 ORDER CANCELLED: ${order.id} - Rs.${order.total.toFixed(2)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          table { width: 100%; border-collapse: collapse; background: white; margin: 15px 0; }
          th { background: #dc3545; color: white; padding: 10px; text-align: left; }
          .info-section { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc3545; }
          .total { background: #dc3545; color: white; padding: 15px; font-size: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
          .action-box { background: #d1ecf1; border-left: 4px solid #0c5460; padding: 20px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ ORDER CANCELLATION ALERT</h1>
            <p style="margin: 10px 0 0 0;">Customer Cancelled an Order</p>
          </div>
          <div class="content">
            <div class="alert-box">
              <h3 style="margin-top: 0; color: #856404;">⚠️ Action Required</h3>
              <p style="margin: 0; color: #856404;">
                A customer has cancelled their order. Please review and process any necessary refunds.
              </p>
            </div>

            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
              <tr style="background: #f8f9fa;">
                <td style="padding: 10px; font-weight: bold; width: 40%;">Order ID:</td>
                <td style="padding: 10px;"><strong>${order.id}</strong></td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold;">Order Date:</td>
                <td style="padding: 10px;">${new Date(order.date).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</td>
              </tr>
              <tr style="background: #f8f9fa;">
                <td style="padding: 10px; font-weight: bold;">Cancellation Date:</td>
                <td style="padding: 10px;">${new Date().toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold;">Customer Name:</td>
                <td style="padding: 10px;">${order.shippingAddress.fullName}</td>
              </tr>
              <tr style="background: #f8f9fa;">
                <td style="padding: 10px; font-weight: bold;">Customer Email:</td>
                <td style="padding: 10px;"><a href="mailto:${customerEmail}">${customerEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold;">Customer Phone:</td>
                <td style="padding: 10px;">${order.shippingAddress.phone}</td>
              </tr>
            </table>

            <div class="total">
              💰 CANCELLED AMOUNT: Rs.${order.total.toFixed(2)}
            </div>

            <h3>📦 Cancelled Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Color</th>
                  <th>Size</th>
                  <th style="text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="info-section">
              <h3>🚚 Shipping Address (Not Required)</h3>
              <p>
                ${order.shippingAddress.fullName}<br>
                ${order.shippingAddress.addressLine1}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
                Phone: ${order.shippingAddress.phone}
              </p>
            </div>

            <div class="action-box">
              <h3 style="margin-top: 0; color: #0c5460;">📋 Next Steps</h3>
              <ol style="margin: 0; padding-left: 20px; color: #0c5460;">
                <li><strong>Verify payment status</strong> - Check if payment was received</li>
                <li><strong>Process refund</strong> - Initiate refund if payment was received</li>
                <li><strong>Update inventory</strong> - Return items to stock if they were allocated</li>
                <li><strong>Archive order</strong> - Update order status in your system</li>
                <li><strong>Customer follow-up</strong> - Consider reaching out to understand why they cancelled</li>
              </ol>
            </div>

            <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #721c24;">
                <strong>⏰ Refund Timeline:</strong> Customer expects refund within 5-7 business days.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:${customerEmail}?subject=Regarding Your Cancelled Order ${order.id}" 
                 style="display: inline-block; background: #053641; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px;">
                Contact Customer
              </a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 12px;">
              This is an automated notification from your ${process.env.SHOP_NAME || 'HriCochets'} store.<br>
              © ${new Date().getFullYear()} ${process.env.SHOP_NAME || 'HriCochets'}. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await sendEmail(mailOptions);
    console.log(`✓ Owner cancellation notification sent to ${ownerEmails.length} owner(s) for order ${order.id}`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`✗ Failed to send owner cancellation notification:`, error);
    return { success: false, error: error.message };
  }
}

// Combined function to send both cancellation emails
export async function sendOrderCancellationEmails(order, customerEmail) {
  console.log(`📧 Initiating cancellation emails for order ${order.id}`);
  console.log(`   Customer: ${customerEmail}`);
  console.log(`   Owner: ${process.env.OWNER_EMAIL || process.env.SMTP_USER}`);
  
  try {
    // Send both emails in parallel
    const [customerResult, ownerResult] = await Promise.allSettled([
      sendOrderCancellationEmail(order, customerEmail),
      sendOwnerOrderCancellationNotification(order, customerEmail)
    ]);

    const customerSuccess = customerResult.status === 'fulfilled' && customerResult.value.success;
    const ownerSuccess = ownerResult.status === 'fulfilled' && ownerResult.value.success;

    console.log(`✓ Cancellation email results:`);
    console.log(`   Customer email: ${customerSuccess ? '✓ Sent' : '✗ Failed'}`);
    console.log(`   Owner email: ${ownerSuccess ? '✓ Sent' : '✗ Failed'}`);
    
    return {
      success: customerSuccess || ownerSuccess, // At least one succeeded
      customerEmailSent: customerSuccess,
      ownerEmailSent: ownerSuccess,
      errors: {
        customer: customerSuccess ? null : customerResult.reason?.message,
        owner: ownerSuccess ? null : ownerResult.reason?.message
      }
    };
  } catch (error) {
    console.error(`✗ Critical error sending cancellation emails for order ${order.id}:`, error);
    return {
      success: false,
      customerEmailSent: false,
      ownerEmailSent: false,
      errors: {
        critical: error.message
      }
    };
  }
}


export default {
  sendWelcomeEmail,
  sendLoginNotification,
  sendOrderConfirmation,
  sendCustomOrderConfirmation,
  sendOwnerOrderNotification,
  sendOwnerCustomOrderNotification,
  sendOwnerNewUserNotification,
  sendOrderCancellationEmail,                    
  sendOwnerOrderCancellationNotification,     
  sendOrderCancellationEmails,
};
