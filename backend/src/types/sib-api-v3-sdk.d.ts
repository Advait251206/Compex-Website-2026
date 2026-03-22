declare module 'sib-api-v3-sdk' {
  interface Authentication {
    apiKey: string;
  }

  export class ApiClient {
    static instance: ApiClient;
    authentications: {
      'api-key': Authentication;
    };
  }

  export class TransactionalEmailsApi {
    sendTransacEmail(sendSmtpEmail: SendSmtpEmail): Promise<any>;
  }

  export class SendSmtpEmail {
    subject?: string;
    htmlContent?: string;
    sender?: { name: string; email: string };
    to?: Array<{ email: string; name?: string }>;
    attachment?: Array<{ content: string; name: string }>;
  }

  const SibApiV3Sdk: {
    ApiClient: typeof ApiClient;
    TransactionalEmailsApi: typeof TransactionalEmailsApi;
    SendSmtpEmail: typeof SendSmtpEmail;
  };

  export default SibApiV3Sdk;
}
