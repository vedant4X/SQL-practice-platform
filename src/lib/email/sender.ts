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
 * Transports an email using configured provider (Resend, Brevo, SMTP) or console logging.
 *
 * NOTE: Transactional email providers (Resend, Brevo, AWS SES) require domain verification (SPF/DKIM)
 * to deliver emails to arbitrary public recipients. In sandbox/unverified domain mode,
 * delivery may be restricted to your account's verified email address.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, text, html, otpCode } = options;
  const isProduction = process.env.NODE_ENV === "production";
  const provider = (process.env.EMAIL_PROVIDER || "").toLowerCase();
  const emailFrom = process.env.EMAIL_FROM || "Quro SQL <noreply@quro.com>";
  const apiKey = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY || process.env.BREVO_API_KEY;

  // 1. Resend Provider
  if ((provider === "resend" || !provider) && apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [to],
          subject,
          text,
          html: html || text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          messageId: data.id,
          devCode: !isProduction ? otpCode : undefined,
        };
      }
      const errText = await res.text();
      console.error("[Email Error] Resend dispatch failed:", errText);
    } catch (err: any) {
      console.error("[Email Error] Resend network error:", err.message);
    }
  }

  // 2. Brevo Provider
  if (provider === "brevo" && apiKey) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { email: emailFrom.replace(/.*<([^>]+)>.*/, "$1"), name: "Quro SQL" },
          to: [{ email: to }],
          subject,
          textContent: text,
          htmlContent: html || text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          messageId: data.messageId,
          devCode: !isProduction ? otpCode : undefined,
        };
      }
      const errText = await res.text();
      console.error("[Email Error] Brevo dispatch failed:", errText);
    } catch (err: any) {
      console.error("[Email Error] Brevo network error:", err.message);
    }
  }

  // 3. Fallback: Development / Test Console Logger
  // NEVER log secret codes or OTP in production environment!
  if (!isProduction) {
    console.log("=================================================");
    console.log(`[EMAIL DISPATCH - DEV CONSOLE]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (otpCode) {
      console.log(`OTP Code: >>> ${otpCode} <<<`);
    }
    console.log("=================================================");
  } else {
    console.log(`[Email Notice] Simulated dispatch to ${to} (Subject: ${subject})`);
  }

  return {
    success: true,
    messageId: `simulated-${Date.now()}`,
    devCode: !isProduction ? otpCode : undefined,
  };
}
