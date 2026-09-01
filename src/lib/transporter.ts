/**
 * Universal email transporter.
 *
 * In Cloudflare Workers: uses cf-smtp.ts (cloudflare:sockets TCP API).
 * In local Node.js dev:  falls back to nodemailer.
 *
 * nodemailer uses Node.js net/tls TCP sockets which are NOT available in CF Workers,
 * even with the nodejs_compat flag, causing a 503 on any request that triggers email sending.
 */

import type { CFEmailOptions, CFSMTPConfig } from "./cf-smtp";

interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

class UniversalTransporter {
  private readonly config: CFSMTPConfig;

  constructor(config: CFSMTPConfig) {
    this.config = config;
  }

  async sendMail(options: MailOptions): Promise<void> {
    const emailData: CFEmailOptions = {
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    // Try CF Workers SMTP first (cloudflare:sockets)
    try {
      const { sendEmailViaCFSMTP } = await import("./cf-smtp");
      await sendEmailViaCFSMTP(this.config, emailData);
      console.log("Email sent via CF SMTP to:", options.to);
      return;
    } catch (cfErr: unknown) {
      const errMsg = cfErr instanceof Error ? cfErr.message : String(cfErr);
      // cloudflare:sockets not available → running in Node.js (local dev) → fall back to nodemailer
      const isCFUnavailable =
        errMsg.includes("cloudflare:sockets") ||
        errMsg.includes("Cannot find module") ||
        errMsg.includes("MODULE_NOT_FOUND") ||
        errMsg.includes("Cannot resolve module");

      if (!isCFUnavailable) {
        // It's an actual SMTP error (auth failure, network error, etc.) — rethrow
        throw cfErr;
      }

      console.log("CF sockets unavailable, falling back to nodemailer");
    }

    // Fallback: nodemailer for local Node.js development
    const nodemailer = await import("nodemailer");
    const isDirectTLS = this.config.port === 465;
    const transport = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: isDirectTLS,
      auth: {
        user: this.config.user,
        pass: this.config.pass,
      },
    });
    await transport.sendMail(options);
    console.log("Email sent via nodemailer to:", options.to);
  }
}

let _transporter: UniversalTransporter | null = null;

export function getTransporter(): UniversalTransporter {
  if (!_transporter) {
    _transporter = new UniversalTransporter({
      host: process.env.SMTP_HOST ?? "smtp.titan.email",
      port: parseInt(process.env.SMTP_PORT ?? "465", 10),
      user: process.env.SMTP_USER ?? "",
      pass: process.env.SMTP_PASS ?? "",
    });
  }
  return _transporter;
}
