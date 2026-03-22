import * as SibApiV3Sdk from 'sib-api-v3-sdk';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}

class EmailService {
  private apiInstance: any;

  constructor() {
    try {
        this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        
        // Configure API key authorization: api-key
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        if (defaultClient && defaultClient.authentications && defaultClient.authentications['api-key']) {
            const apiKey = defaultClient.authentications['api-key'];
            apiKey.apiKey = process.env.BREVO_API_KEY || '';
            if (process.env.BREVO_API_KEY) {
                console.log('✅ Brevo API Configured');
            } else {
                console.warn('⚠️ Brevo API Key is MISSING in Environment Variables');
            }
        } else {
             console.warn('⚠️ Brevo API Client structure unexpected');
        }
    } catch (error) {
        console.error('❌ Failed to initialize Brevo API:', error);
    }
  }

  /**
   * Send an email using Brevo API
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

      sendSmtpEmail.subject = options.subject;
      sendSmtpEmail.htmlContent = options.html;
      sendSmtpEmail.sender = { "name": "Comp-Ex", "email": "visitcompex@gmail.com" };
      sendSmtpEmail.to = [{ "email": options.to }];

      if (options.attachments && options.attachments.length > 0) {
          sendSmtpEmail.attachment = options.attachments.map(att => ({
              content: att.content.toString('base64'),
              name: att.filename
          }));
      }

      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Email sent to ${options.to} via Brevo`);
    } catch (error: any) {
      console.error('❌ Email sending error:', error?.body || error);
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  /**
   * Send OTP email with HTML template
   */
  async sendOTP(email: string, otp: string, firstName: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #000000;
            margin: 0;
            padding: 0;
            color: #ffffff;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #0f1014;
            border: 1px solid #2d2d3a;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
          }
          .header {
            background-image: linear-gradient(135deg, #4338ca 0%, #312e81 100%);
            padding: 40px 20px;
            text-align: center;
            border-bottom: 1px solid #4338ca;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            color: #ffffff;
            letter-spacing: 2px;
            text-transform: uppercase;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .otp-box {
            background-color: rgba(99, 102, 241, 0.1);
            border: 2px solid #6366f1;
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
            display: inline-block;
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
          }
          .otp-code {
            font-size: 42px;
            font-weight: bold;
            color: #a5b4fc;
            letter-spacing: 12px;
            margin: 0;
            font-family: 'Courier New', Courier, monospace;
            text-shadow: 0 0 5px #6366f1;
          }
          .message {
            color: #cbd5e1;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .highlight {
            color: #818cf8;
            font-weight: 600;
          }
          .warning {
            color: #f87171;
            font-size: 13px;
            margin-top: 30px;
            border-top: 1px solid #334155;
            padding-top: 20px;
          }
          .footer {
            background-color: #050505;
            padding: 20px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
            border-top: 1px solid #1e293b;
          }
          /* Button style link */
         .btn-link {
            color: #6366f1;
            text-decoration: none;
         }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>COMP-EX VERIFICATION</h1>
          </div>
          <div class="content">
            <p class="message">Hello <span class="highlight">${firstName}</span>,</p>
            <p class="message">You are one step away! Use the code below to verify your email address and continue:</p>
            
            <div class="otp-box">
              <p class="otp-code">${otp}</p>
            </div>
            
            <p class="message">This code expires in <strong>5 minutes</strong>.</p>
            
            <div class="warning">
              ⚠️ For your security, please do not share this code with anyone.
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Comp-Ex Registration. All systems operational.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Your OTP Verification Code',
      html
    });
  }

  /**
   * Send Ticket Email with PDF Attachment
   */
  async sendTicketEmail(email: string, firstName: string, pdfBuffer: Buffer, ticketId: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Confirmed</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #000000; margin: 0; padding: 0; color: #ffffff; }
          .container { max-width: 600px; margin: 40px auto; background-color: #0f1014; border: 1px solid #2d2d3a; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; }
          .content { padding: 40px 30px; text-align: center; }
          .success-icon { font-size: 48px; margin-bottom: 20px; }
          .message { color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
          .highlight { color: #34d399; font-weight: 600; }
          .ticket-info { background: rgba(16, 185, 129, 0.1); border: 1px solid #059669; border-radius: 12px; padding: 20px; margin: 30px 0; }
          .footer { background-color: #050505; padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>REGISTRATION CONFIRMED</h1>
          </div>
          <div class="content">
            <div class="success-icon">✅</div>
            <p class="message">Hello <span class="highlight">${firstName}</span>,</p>
            <p class="message">Your registration for <strong>COMP-EX 2026</strong> is confirmed!</p>
            
            <div class="ticket-info">
              <p style="margin:0;color:#34d399;font-weight:bold;">TICKET ID: ${ticketId.toUpperCase().slice(-8)}</p>
            </div>
            
            <p class="message">Your official entry pass is attached to this email as a PDF.</p>
            <p class="message">Please present the QR code at the entrance.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Comp-Ex Registration. See you there!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Your Comp-Ex 2026 Entry Pass',
      html,
      attachments: [{
          filename: `CompEx-Ticket-${ticketId.slice(-6)}.pdf`,
          content: pdfBuffer
      }]
    });
  }

  // Wrapper methods for standalone usage if needed (to match existing controller imports)
  async sendOTPEmail(email: string, otp: string, firstName: string) {
      return this.sendOTP(email, otp, firstName);
  }

  /**
   * Send Winner Notification Email
   */
  async sendWinnerEmail(email: string, firstName: string, prize: string = 'Exclusive Swag'): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #000000; color: #ffffff; }
          .container { max-width: 600px; margin: 20px auto; background-color: #0f1014; border: 1px solid #d4af37; border-radius: 12px; }
          .header { background: linear-gradient(135deg, #d4af37 0%, #b4922b 100%); padding: 30px; text-align: center; }
          .title { font-size: 24px; font-weight: bold; color: #000; margin: 0; text-transform: uppercase; }
          .content { padding: 40px; text-align: center; }
          .trophy { font-size: 60px; margin-bottom: 20px; }
          .message { color: #e2e8f0; font-size: 16px; margin-bottom: 20px; }
          .highlight { color: #d4af37; font-weight: bold; font-size: 18px; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #333; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">🎉 We Have a Winner! 🎉</h1>
          </div>
          <div class="content">
            <div class="trophy">🏆</div>
            <p class="message">Congratulations <span class="highlight">${firstName}</span>!</p>
            <p class="message">You have been selected as a winner in the <strong>COMP-EX Lucky Draw</strong>!</p>
            <p class="message" style="background:#222; padding:15px; border-radius:8px; border:1px solid #444;">
              We will contact you shortly with details on how to claim your prize!
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Comp-Ex.
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '🏆 YOU WON! Comp-Ex Lucky Draw',
      html
    });
  }
}

export const emailService = new EmailService();
// Export standalone functions to match controller usage
export const sendOTPEmail = (email: string, otp: string, firstName: string) => emailService.sendOTP(email, otp, firstName);
export const sendTicketEmail = (email: string, firstName: string, pdfBuffer: Buffer, ticketId: string) => emailService.sendTicketEmail(email, firstName, pdfBuffer, ticketId);
export const sendWinnerEmail = (email: string, firstName: string, prize?: string) => emailService.sendWinnerEmail(email, firstName, prize);
export default emailService;
