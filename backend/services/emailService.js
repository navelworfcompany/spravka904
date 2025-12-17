import nodemailer from 'nodemailer';
import { AppError } from '../middleware/errorHandler.js';

export class EmailService {
  static transporter = null;

  /**
   * Инициализация email транспорта
   */
  static init() {
    if (this.transporter) {
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'false',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    return this.transporter;
  }

  /**
   * Отправка email
   */
  static async sendEmail(to, subject, html, text = null) {
    try {
      const transporter = this.init();

      const mailOptions = {
        from: process.env.SMTP_FROM || '"Order System" <noreply@ordersystem.com>',
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const info = await transporter.sendMail(mailOptions);

      console.log('Email sent:', info.messageId);

      // В development показываем preview URL
      if (process.env.NODE_ENV === 'development') {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return info;
    } catch (error) {
      console.error('Email sending error:', error);
      throw new AppError('Ошибка при отправке email', 500);
    }
  }

  /**
   * Отправка уведомления о ответе работника
   */
  static async sendWorkerResponseNotification(application, response, clientEmail) {
    const subject = `Ответ по вашей заявке #${application.id}`;
    const html = `
      <h2>Ответ по вашей заявке</h2>
      <p>По вашей заявке поступил ответ от работника:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        ${response.response}
      </div>
      <p><strong>Заявка:</strong> ${application.product_type} - ${application.product}</p>
      <p><a href="${process.env.FRONTEND_URL}/my-applications">Посмотреть все заявки</a></p>
    `;

    if (clientEmail) {
      await this.sendEmail(clientEmail, subject, html);
    }
  }

  /**
   * Отправка уведомления о регистрации работника
   */
  static async sendWorkerRegistrationNotification(request, adminEmails) {
    const subject = 'Новый запрос на регистрацию работника';
    const html = `
      <h2>Новый запрос на регистрацию</h2>
      <p>Поступил новый запрос на регистрацию работника:</p>
      <ul>
        <li><strong>Организация:</strong> ${request.organization}</li>
        <li><strong>Телефон:</strong> ${request.phone}</li>
        <li><strong>Email:</strong> ${request.email}</li>
        <li><strong>Дата:</strong> ${new Date(request.created_at).toLocaleString('ru-RU')}</li>
      </ul>
      <p><a href="${process.env.FRONTEND_URL}/admin/worker-requests">Перейти к запросам</a></p>
    `;

    for (const email of adminEmails) {
      await this.sendEmail(email, subject, html);
    }
  }

  /**
   * Отправка уведомления об одобрении регистрации
   */
  static async sendWorkerApprovalNotification(workerEmail, organization) {
    const subject = 'Ваша регистрация одобрена';
    const html = `
      <h2>Регистрация одобрена</h2>
      <p>Ваша регистрация в качестве работника организации <strong>${organization}</strong> была одобрена администратором.</p>
      <p>Теперь вы можете войти в систему используя ваш телефон и пароль.</p>
      <p><a href="${process.env.FRONTEND_URL}/worker">Перейти к входу</a></p>
    `;

    await this.sendEmail(workerEmail, subject, html);
  }

  /**
   * Конвертация HTML в текст
   */
  static htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Верификация подключения email
   */
  static async verifyConnection() {
    try {
      const transporter = this.init();
      console.log('🔗 Testing SMTP connection...');
      console.log('SMTP Host:', process.env.SMTP_HOST);
      console.log('SMTP Port:', process.env.SMTP_PORT);
      console.log('SMTP User:', process.env.SMTP_USER);

      await transporter.verify();
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error.message);
      console.error('Error code:', error.code);
      console.error('Error command:', error.command);
      return false;
    }
  }

  static async sendContactFormNotification(contactData, adminEmails) {
    console.log('📧 Preparing contact form email...');

    const subject = `📞 Новая заявка на обратный звонок`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
        📞 Новая заявка на обратный звонок
      </h2>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #495057; margin-top: 0;">Данные клиента:</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; width: 120px; font-weight: bold; color: #495057;">Имя:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; font-size: 16px;">${contactData.name}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Телефон:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; font-size: 16px;">
              <a href="tel:${contactData.phone}" style="color: #007bff; text-decoration: none; font-weight: bold;">
                ${contactData.phone}
              </a>
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 25px; padding: 15px; background: #e7f3ff; border-radius: 6px; border-left: 4px solid #007bff;">
        <p style="margin: 0; color: #0056b3; font-size: 14px;">
          <strong>📅 Дата заявки:</strong> ${new Date().toLocaleString('ru-RU')}
        </p>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 6px; border: 1px solid #ffeaa7;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          ⚡ <strong>Срочно!</strong> Пожалуйста, свяжитесь с клиентом в ближайшее время.
        </p>
      </div>
    </div>
  `;

    const text = `
НОВАЯ ЗАЯВКА НА ОБРАТНЫЙ ЗВОНОК

Имя: ${contactData.name}
Телефон: ${contactData.phone}

Дата: ${new Date().toLocaleString('ru-RU')}

Срочно свяжитесь с клиентом!
  `;

    console.log(`📤 Sending to ${adminEmails.length} recipients:`, adminEmails);

    // Отправляем email всем администраторам
    for (const email of adminEmails) {
      try {
        console.log(`📨 Sending to: ${email}`);
        const info = await this.sendEmail(email, subject, html, text);
        console.log(`✅ Email sent to ${email}:`, info.messageId);
      } catch (error) {
        console.error(`❌ Failed to send to ${email}:`, error);
        throw error;
      }
    }

    console.log('🎉 All emails sent successfully');
  }

  static async sendProductApplicationNotification(applicationData, adminEmails) {
    console.log('📧 Preparing product application email...');

    const subject = `🪦 Новая заявка на памятник #${applicationData.applicationData.id}: ${applicationData.applicationData.product}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
        🪦 Новая заявка на памятник
      </h2>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #495057; margin-top: 0;">📋 Информация о заказе:</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; width: 150px; font-weight: bold; color: #495057;">Номер заявки:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-size: 16px;">#${applicationData.applicationData.id}</td>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Тип памятника:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${applicationData.applicationData.productType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Модель:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${applicationData.applicationData.product}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Материал:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${applicationData.applicationData.material}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Размер:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${applicationData.applicationData.size}</td>
          </tr>
          ${applicationData.applicationData.comment && applicationData.applicationData.comment !== 'не указан' ? `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Комментарий:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-style: italic;">${applicationData.applicationData.comment}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #495057; margin-top: 0;">👤 Контактные данные клиента:</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #b8daff; width: 100px; font-weight: bold; color: #495057;">Имя:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #b8daff; font-size: 16px;">${applicationData.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #b8daff; font-weight: bold; color: #495057;">Телефон:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #b8daff;">
              <a href="tel:${applicationData.phone}" style="color: #007bff; text-decoration: none; font-weight: bold;">
                ${applicationData.phone}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #495057;">Email:</td>
            <td style="padding: 8px 0;">
              <a href="mailto:${applicationData.email}" style="color: #007bff; text-decoration: none;">
                ${applicationData.email}
              </a>
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 25px; padding: 15px; background: #fff3cd; border-radius: 6px; border: 1px solid #ffeaa7;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          ⚡ <strong>Срочная заявка!</strong> Клиент ожидает предложений в течение 24 часов.
        </p>
      </div>

      <div style="margin-top: 15px; padding: 15px; background: #d4edda; border-radius: 6px; border: 1px solid #c3e6cb;">
        <p style="margin: 0; color: #155724; font-size: 14px;">
          📅 <strong>Дата заявки:</strong> ${new Date(applicationData.applicationData.timestamp).toLocaleString('ru-RU')}
        </p>
      </div>
    </div>
  `;

    const text = `
НОВАЯ ЗАЯВКА НА ПАМЯТНИК

📋 ИНФОРМАЦИЯ О ЗАКАЗЕ:
Номер заявки: #${applicationData.applicationData?.id}
Тип памятника: ${applicationData.applicationData.productType}
Модель: ${applicationData.applicationData.product}
Материал: ${applicationData.applicationData.material}
Размер: ${applicationData.applicationData.size}
${applicationData.applicationData.comment && applicationData.applicationData.comment !== 'не указан' ? `Комментарий: ${applicationData.applicationData.comment}` : ''}

👤 КОНТАКТНЫЕ ДАННЫЕ:
Имя: ${applicationData.name}
Телефон: ${applicationData.phone}
Email: ${applicationData.email}

📅 Дата заявки: ${new Date(applicationData.applicationData.timestamp).toLocaleString('ru-RU')}

⚡ СРОЧНО! Клиент ожидает предложений в течение 24 часов.
  `;

    console.log(`📤 Sending product application to ${adminEmails.length} recipients:`, adminEmails);

    // Отправляем email всем администраторам
    for (const email of adminEmails) {
      try {
        console.log(`📨 Sending product application to: ${email}`);
        const info = await this.sendEmail(email, subject, html, text);
        console.log(`✅ Product application email sent to ${email}:`, info.messageId);
      } catch (error) {
        console.error(`❌ Failed to send product application to ${email}:`, error);
        throw error;
      }
    }

    console.log('🎉 All product application emails sent successfully');
  }

  /**
   * Отправка подтверждения заявки клиенту с логином и паролем
   */
  static async sendApplicationConfirmationToClient(clientEmail, applicationData, password, isExistingUser = false) {
    console.log('📧 Preparing application confirmation email for client...');

    const subject = `✅ Ваша заявка на памятник принята - ${applicationData.applicationData.id}`;

    const loginSection = isExistingUser ? `
    <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #495057; margin-top: 0;">🔐 Ваш аккаунт</h3>
      <p style="color: #495057; margin: 10px 0;">Вы уже зарегистрированы в нашей системе. Используйте существующие данные для входа здесь: http://localhost:3000/client</p>
      <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 4px;">
        <tr>
          <td style="padding: 10px; border: 1px solid #b8daff; font-weight: bold; color: #495057; width: 120px;">Логин:</td>
          <td style="padding: 10px; border: 1px solid #b8daff; font-family: monospace; font-size: 16px;">${applicationData.phone}</td>
        </tr>
      </table>
      <p style="color: #6c757d; font-size: 14px; margin-top: 10px;">Если вы забыли пароль, воспользуйтесь функцией восстановления.</p>
    </div>
  ` : `
    <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #495057; margin-top: 0;">🔐 Ваш аккаунт создан</h3>
      <p style="color: #495057; margin: 10px 0;">Мы создали для вас личный кабинет, где вы сможете отслеживать статус заявки:</p>
      <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 4px;">
        <tr>
          <td style="padding: 10px; border: 1px solid #b8daff; font-weight: bold; color: #495057; width: 120px;">Логин:</td>
          <td style="padding: 10px; border: 1px solid #b8daff; font-family: monospace; font-size: 16px;">${applicationData.phone}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #b8daff; font-weight: bold; color: #495057;">Пароль:</td>
          <td style="padding: 10px; border: 1px solid #b8daff; font-family: monospace; font-size: 16px; font-weight: bold; color: #28a745;">${password}</td>
        </tr>
      </table>
      <p style="color: #495057; margin: 15px 0 5px 0;"><strong>Ссылка для входа: http://localhost:3000/client</strong></p>
      <div style="text-align: center; margin: 15px 0;">
        <a href="${process.env.FRONTEND_URL}/client" 
           style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          📱 Перейти в личный кабинет
        </a>
      </div>
      <p style="color: #856404; font-size: 14px; margin-top: 10px;">
        ⚠️ <strong>Сохраните этот пароль!</strong>
      </p>
    </div>
  `;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px;">
        ✅ Ваша заявка принята!
      </h2>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #495057; margin-top: 0;">📋 Детали вашей заявки:</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; width: 150px; font-weight: bold; color: #495057;">Номер заявки:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-size: 16px; font-weight: bold;">${applicationData.applicationData.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Тип памятника:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${applicationData.applicationData.productType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Модель:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${applicationData.applicationData.product}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Материал:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${applicationData.applicationData.material}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Размер:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${applicationData.applicationData.size}</td>
          </tr>
          ${applicationData.applicationData.comment && applicationData.applicationData.comment !== 'не указан' ? `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Ваш комментарий:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-style: italic;">${applicationData.applicationData.comment}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      ${loginSection}

      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #856404; margin-top: 0;">📞 Что дальше?</h3>
        <ul style="color: #856404; line-height: 1.6;">
          <li>Мы уже уведомили проверенных мастеров о вашей заявке</li>
          <li>В течение <strong>24 часов</strong> вы получите предложения с ценами</li>
          <li>Оператор свяжется с вами по указанному телефону</li>
          <li>В личном кабинете вы сможете отслеживать все предложения</li>
        </ul>
      </div>

      <div style="margin-top: 20px; text-align: center; color: #6c757d; font-size: 12px;">
        <p>Это автоматическое уведомление, пожалуйста, не отвечайте на это письмо</p>
      </div>
    </div>
  `;

    const text = isExistingUser ? `
ВАША ЗАЯВКА ПРИНЯТА!

📋 ДЕТАЛИ ЗАЯВКИ:
Номер заявки: ${applicationData.applicationData.id}
Тип памятника: ${applicationData.applicationData.productType}
Модель: ${applicationData.applicationData.product}
Материал: ${applicationData.applicationData.material}
Размер: ${applicationData.applicationData.size}
${applicationData.applicationData.comment && applicationData.applicationData.comment !== 'не указан' ? `Ваш комментарий: ${applicationData.applicationData.comment}` : ''}

🔐 ВАШ АККАУНТ:
Вы уже зарегистрированы в нашей системе.
Логин: ${applicationData.phone}
Используйте существующий пароль для входа.

📞 ЧТО ДАЛЬШЕ?
• Мы уведомили мастеров о вашей заявке
• В течение 24 часов вы получите предложения с ценами
• Мастера свяжутся с вами по телефону
• В личном кабинете отслеживайте все предложения

Ссылка для входа: ${process.env.FRONTEND_URL}/client
  ` : `
ВАША ЗАЯВКА ПРИНЯТА!

📋 ДЕТАЛИ ЗАЯВКИ:
Номер заявки: ${applicationData.applicationData.id}
Тип памятника: ${applicationData.applicationData.productType}
Модель: ${applicationData.applicationData.product}
Материал: ${applicationData.applicationData.material}
Размер: ${applicationData.applicationData.size}
Стоимость: от ${applicationData.applicationData.price ? applicationData.applicationData.price.toLocaleString('ru-RU') : '0'} руб.
${applicationData.applicationData.comment && applicationData.applicationData.comment !== 'не указан' ? `Ваш комментарий: ${applicationData.applicationData.comment}` : ''}

🔐 ВАШ АККАУНТ СОЗДАН:
Логин: ${applicationData.phone}
Пароль: ${password}

📱 Ссылка для входа: ${process.env.FRONTEND_URL}/client

⚠️ Сохраните этот пароль!

📞 ЧТО ДАЛЬШЕ?
• Мы уведомили мастеров о вашей заявке
• В течение 24 часов вы получите предложения с ценами
• Мастера свяжутся с вами по телефону
• В личном кабинете отслеживайте все предложения
  `;

    console.log(`📤 Sending confirmation to client: ${clientEmail}`);

    try {
      const transporter = this.init();

      const mailOptions = {
        from: process.env.SMTP_FROM_CLIENT || '"Ритуальная справочная" <noreply@ritual-spravka.ru>',
        to: clientEmail,
        subject,
        html,
        text: text || this.htmlToText(html),
        headers: {
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
          'Auto-Submitted': 'auto-generated'
        }
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Confirmation email sent to client:`, info.messageId);
      return info;
    } catch (error) {
      console.error(`❌ Failed to send confirmation to client:`, error);
      console.log('⚠️ Continuing without client confirmation email...');
      return null;
    }
  }

  // Добавить в класс EmailService
static async sendApplicationResponseToClient(clientEmail, application, workerResponse, workerInfo) {
  console.log('📧 Подготовка уведомления клиенту о новом ответе...');

  const subject = `📝 Ответ на вашу заявку #${application.id}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">
        📝 Получен ответ на вашу заявку
      </h2>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #495057; margin-top: 0;">📋 Детали заявки:</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; width: 120px; font-weight: bold; color: #495057;">Номер:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-size: 16px; font-weight: bold;">#${application.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Товар:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${application.product_name || application.product}</td>
          </tr>
          ${application.product_type_name ? `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Тип:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${application.product_type_name}</td>
          </tr>
          ` : ''}
          ${application.material ? `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Материал:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${application.material}</td>
          </tr>
          ` : ''}
          ${application.size ? `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Размер:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${application.size}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
        <h3 style="color: #1976d2; margin-top: 0;">👷 Ответ мастера:</h3>
        
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 0; color: #333; line-height: 1.6; font-style: italic;">
            "${workerResponse.response}"
          </p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #b8daff; width: 120px; font-weight: bold; color: #495057;">Цена:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #b8daff; font-size: 18px; font-weight: bold; color: #28a745;">
              ${new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(workerResponse.price)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #495057;">Срок выполнения:</td>
            <td style="padding: 8px 0; font-weight: bold;">
              ${new Date(workerResponse.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </td>
          </tr>
        </table>
      </div>

      ${workerInfo ? `
      <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #f57c00; margin-top: 0;">👨‍🏭 Информация о мастере:</h4>
        <p style="margin: 5px 0; color: #666;">
          <strong>Мастер:</strong> ${workerInfo.name || 'Не указано'}
        </p>
        <p style="margin: 5px 0; color: #666;">
          <strong>Организация:</strong> ${workerInfo.organization || 'Индивидуальный мастер'}
        </p>
        <!-- Убрали телефон и email мастера -->
      </div>
      ` : ''}

      <div style="text-align: center; margin: 25px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/client" 
           style="background: #1976d2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
          📱 Перейти в личный кабинет
        </a>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef;">
        <p style="margin: 0; color: #6c757d; font-size: 14px;">
          🔔 Вы можете принять этот ответ, отклонить его или ожидать другие предложения от других мастеров.
        </p>
        <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 14px;">
          Для связи с мастером воспользуйтесь личным кабинетом.
        </p>
      </div>

      <div style="margin-top: 20px; text-align: center; color: #6c757d; font-size: 12px;">
        <p>Это автоматическое уведомление, пожалуйста, не отвечайте на это письмо</p>
        <p>С уважением, команда ${process.env.APP_NAME || 'Ритуальная справочная'}</p>
      </div>
    </div>
  `;

  const text = `
ОТВЕТ НА ВАШУ ЗАЯВКУ

📋 ДЕТАЛИ ЗАЯВКИ:
Номер: #${application.id}
Товар: ${application.product_name || application.product}
${application.product_type_name ? `Тип: ${application.product_type_name}` : ''}
${application.material ? `Материал: ${application.material}` : ''}
${application.size ? `Размер: ${application.size}` : ''}

👷 ОТВЕТ МАСТЕРА:
"${workerResponse.response}"

💵 Цена: ${new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(workerResponse.price)}
📅 Срок выполнения: ${new Date(workerResponse.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}

${workerInfo ? `
👨‍🏭 ИНФОРМАЦИЯ О МАСТЕРЕ:
Мастер: ${workerInfo.name || 'Не указано'}
Организация: ${workerInfo.organization || 'Индивидуальный мастер'}
` : ''}

🔔 Действия:
- Принять этот ответ
- Отклонить его
- Ждать другие предложения

Для связи с мастером воспользуйтесь личным кабинетом.

📱 Перейти в личный кабинет: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/client

Это автоматическое уведомление.
С уважением, команда ${process.env.APP_NAME || 'Ритуальная справочная'}
  `;

  console.log(`📤 Отправляем уведомление клиенту: ${clientEmail}`);

  try {
    const transporter = this.init();

    const mailOptions = {
      from: process.env.SMTP_FROM_CLIENT || '"Ритуальная справочная" <noreply@ritual-spravka.ru>',
      to: clientEmail,
      subject,
      html,
      text,
      headers: {
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'Auto-Submitted': 'auto-generated'
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Уведомление отправлено клиенту:`, info.messageId);
    return info;
  } catch (error) {
    console.error(`❌ Ошибка отправки уведомления клиенту:`, error);
    console.log('⚠️ Продолжаем работу без email уведомления...');
    return null;
  }
}

}
export default EmailService;