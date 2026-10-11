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
 * NOTE: Transactional email providers (Resend, Brevo) require a verified domain (SPF/DKIM)
 * to deliver emails to arbitrary public recipients. With an unverified/sandbox domain,
 * Resend sends from "onboarding@resend.dev" and only delivers to your own registered account email.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, text, html, otpCode } = options;
  const isProduction = process.env.NODE_ENV === "production";
  const provider = (process.env.EMAIL_PROVIDER || "").toLowerCase();
  
  // Default to onboarding@resend.dev if not customized, so free Resend sandbox works out-of-the-box
  const emailFrom = process.env.EMAIL_FROM || "Quro SQL <onboarding@resend.dev>";
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

      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.message || `Resend HTTP error ${res.status}`;
      console.error("[Email Error] Resend dispatch failed:", errMsg);
      return {
        success: false,
        error: `Email delivery failed: ${errMsg}`,
      };
    } catch (err: any) {
      console.error("[Email Error] Resend network error:", err.message);
      return {
        success: false,
        error: `Email network error: ${err.message}`,
      };
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
      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.message || `Brevo HTTP error ${res.status}`;
      console.error("[Email Error] Brevo dispatch failed:", errMsg);
      return {
        success: false,
        error: `Brevo delivery failed: ${errMsg}`,
      };
    } catch (err: any) {
      console.error("[Email Error] Brevo network error:", err.message);
      return {
        success: false,
        error: `Brevo network error: ${err.message}`,
      };
    }
  }

  // 3. If in production and NO API key is set
  if (isProduction && !apiKey) {
    const errorMsg =
      "No email provider configured. Please set RESEND_API_KEY in your Vercel Environment Variables.";
    console.error(`[Email Error] ${errorMsg}`);
    return {
      success: false,
      error: errorMsg,
    };
  }

  // 4. Fallback: Development / Test Console Logger
  console.log("=================================================");
  console.log(`[EMAIL DISPATCH - DEV CONSOLE]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  if (otpCode) {
    console.log(`OTP Code: >>> ${otpCode} <<<`);
  }
  console.log("=================================================");

  return {
    success: true,
    messageId: `dev-${Date.now()}`,
    devCode: otpCode,
  };
}
