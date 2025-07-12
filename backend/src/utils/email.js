const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `Smart Shopping <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Email send error:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome to Smart Shopping!</h1>
        <p>Hi ${user.name},</p>
        <p>Thank you for joining Smart Shopping. We're excited to help you make smarter shopping decisions.</p>
        <p>Here's what you can do with your account:</p>
        <ul>
          <li>Scan products to get instant information</li>
          <li>Track your spending and savings</li>
          <li>Get personalized health insights</li>
          <li>Chat with our AI assistant for recommendations</li>
        </ul>
        <p>Get started by visiting your dashboard:</p>
        <a href="${process.env.CLIENT_URL}/${user.role}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Go to Dashboard
        </a>
        <p>Best regards,<br>The Smart Shopping Team</p>
      </div>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Welcome to Smart Shopping!',
      html,
      text: `Welcome to Smart Shopping, ${user.name}!`
    });
  }

  async sendLowStockAlert(seller, products) {
    const productList = products
      .map(p => `- ${p.name}: ${p.stockLevel} units remaining`)
      .join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #EF4444;">Low Stock Alert</h1>
        <p>Hi ${seller.name},</p>
        <p>The following products are running low on stock:</p>
        <pre style="background-color: #F3F4F6; padding: 10px; border-radius: 5px;">
${productList}
        </pre>
        <p>Please restock these items as soon as possible to avoid stockouts.</p>
        <a href="${process.env.CLIENT_URL}/seller/inventory" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Inventory
        </a>
        <p>Best regards,<br>Smart Shopping Inventory System</p>
      </div>
    `;

    await this.sendEmail({
      to: seller.email,
      subject: 'Low Stock Alert - Action Required',
      html,
      text: `Low stock alert: ${productList}`
    });
  }
}

module.exports = new EmailService();