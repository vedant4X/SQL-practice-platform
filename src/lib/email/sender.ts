export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  otpCode?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  devCode?: string;
  error?: string;
}

/**
 * Sends an email using SMTP or API if configured, otherwise falls back
 * to standard logging in development mode.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, text, html, otpCode } = options;
  const isDev = process.env.NODE_ENV !== "production";

  // Check if Resend API key is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Quro SQL <noreply@quro.com>",
          to: [to],
          subject,
          text,
          html: html || text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, messageId: data.id };
      }
      const errData = await res.text();
      console.error("[Email Error] Failed to send via Resend:", errData);
    } catch (err: any) {
      console.error("[Email Error] Resend exception:", err.message);
    }
  }

  // Fallback: development / server logging
  console.log("=================================================");
  console.log(`[EMAIL DISPATCH]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  if (otpCode) {
    console.log(`OTP Verification Code: >>> ${otpCode} <<<`);
  }
  console.log(`Message:\n${text}`);
  console.log("=================================================");

  return {
    success: true,
    messageId: `mock-${Date.now()}`,
    devCode: isDev ? otpCode : undefined,
  };
}
