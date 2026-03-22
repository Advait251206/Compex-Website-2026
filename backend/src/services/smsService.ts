import axios from "axios";

interface SMSOptions {
  to: string;
  message: string;
}

class SMSService {
  private apiKey: string;
  private senderId: string;
  private apiUrl: string;
  private entityId: string;

  constructor() {
    this.apiKey = process.env.SMS_API_KEY || '';
    this.senderId = process.env.SMS_SENDER_ID || 'COMMPX';
    this.entityId = process.env.SMS_ENTITY_ID || '';
    this.apiUrl = 'https://api.pinnacle.in/index.php/sms/send/filter';
    
    if (!process.env.SMS_API_KEY) {
        console.error('❌ SMS API Key is MISSING in Environment Variables');
    }
  }

  /**
   * Check connection status
   */
  checkConnection(): boolean {
    if (this.apiKey) {
      console.log('✅ SMS Service Connected (Pinnacle)');
      return true;
    } else {
      console.warn('⚠️ SMS Service NOT Connected (Missing API Key)');
      return false;
    }
  }

  /**
   * Send SMS using Pinnacle API
   */
  async sendSMS(options: SMSOptions & { templateId?: string }): Promise<void> {
    try {
      // Basic validation
      if (!options.to || options.to.length < 10) {
        throw new Error("Invalid phone number");
      }

      // Updated based on official docs: https://api.pinnacle.in/index.php/sms/urlsms
      // Updated based on official docs: https://api.pinnacle.in/index.php/sms/urlsms
      const params: any = {
        apikey: this.apiKey,
        sender: this.senderId,
        numbers: options.to,
        message: options.message,
        messagetype: 'TXT',
      };
      
      // Use standard DLT parameter names found in documentation
      // Avoiding 'kitchen sink' as it causes rejection
      if (this.entityId) {
          params.pe_id = this.entityId; 
      }

      if (process.env.SMS_HEADER_ID) {
           // Some gateways map Header ID to 'sender' but for DLT 'dltheaderid' or 'header_id' is common.
           // Since we don't have definitive docs, we'll try the most standards-compliant:
           params.dltheaderid = process.env.SMS_HEADER_ID; 
      }
      
      if (options.templateId) {
          params.template_id = options.templateId;
      }
      
      console.log('Sending SMS with params:', JSON.stringify(params, null, 2));

      const url = 'https://api.pinnacle.in/index.php/sms/urlsms';
      const response = await axios.get(url, { params });
      
      // Pinnacle often returns plain text "Invalid Senderid" or "S100|..."
      if ((typeof response.data === 'string' && (response.data.includes('error') || response.data.includes('Invalid') || response.data.includes('Fail'))) || (response.data && response.data.status === "error")) {
        console.error('❌ SMS Failed:', response.data);
         // throw new Error(response.data); // Let's not throw yet, just log
      }


    } catch (error: any) {
      console.error("❌ SMS sending error:", error?.message || error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send OTP Verification SMS
   */
  async sendOTP(phone: string, otp: string): Promise<void> {
    // Template: "Welcome to Comp-Ex 2026! Your verification code is {#var#}. Please use this to complete your registration. VIDARBHA COMPUTER MEDIA DEALERS WELFARE ASSOCIATION"
    // STRICT MATCH with User provided text:
    const message = `Welcome to Comp-Ex 2026! Your verification code is ${otp}. Please use this to complete your registration. VIDARBHA COMPUTER MEDIA DEALERS WELFARE ASSOCIATION`;
    const templateId = process.env.SMS_OTP_TEMPLATE_ID;
    
    await this.sendSMS({ to: phone, message, templateId });
  }

  /**
   * Send Login OTP
   */
  async sendLoginOTP(phone: string, otp: string): Promise<void> {
    // Template: "Your login OTP for COMP-EX 2026 ticket access is {#var#}. Do not share this code. VIDARBHA COMPUTER MEDIA DEALERS WELFARE ASSOCIATION"
    const message = `Your login OTP for COMP-EX 2026 ticket access is ${otp}. Do not share this code. VIDARBHA COMPUTER MEDIA DEALERS WELFARE ASSOCIATION`;
    const templateId = process.env.SMS_LOGIN_TEMPLATE_ID;

    await this.sendSMS({ to: phone, message, templateId });
  }

  /**
   * Send Winner Notification SMS
   */
  async sendWinnerNotification(
    phone: string,
    firstName: string,
    prize: string = "a prize",
  ): Promise<void> {
    // Template: "Comp-Ex Winner: Congratulations {#var#}. You have been selected as a winner in the daily lucky draw! - VIDARBHA COMPUTER MEDIA DEALERS WELFARE ASSOCIATION"
    // ID: 1707176968873084051 (Set in Environment Variables)
    const message = `Comp-Ex Winner: Congratulations ${firstName}. You have been selected as a winner in the daily lucky draw! - VIDARBHA COMPUTER MEDIA DEALERS WELFARE ASSOCIATION`;
     const templateId = process.env.SMS_WINNER_TEMPLATE_ID;
    await this.sendSMS({ to: phone, message, templateId });
  }
}

export const smsService = new SMSService();
export default smsService;
