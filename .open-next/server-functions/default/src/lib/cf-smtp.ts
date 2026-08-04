/**
 * CF Workers SMTP client using cloudflare:sockets TCP API.
 * Replaces nodemailer which requires Node.js net/tls modules not available in CF Workers.
 *
 * Flow: TCP connect → EHLO → STARTTLS → socket.startTls() → EHLO → AUTH LOGIN → MAIL FROM → RCPT TO → DATA → QUIT
 */

export interface CFSMTPConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export interface CFEmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

// Buffered line reader for ReadableStream<Uint8Array>
class SMTPStreamReader {
  private buffer = "";
  private decoder = new TextDecoder();
  private reader: ReadableStreamDefaultReader<Uint8Array>;

  constructor(readable: ReadableStream<Uint8Array>) {
    this.reader = readable.getReader();
  }

  private async fill(): Promise<void> {
    const { done, value } = await this.reader.read();
    if (done) throw new Error("SMTP: connection closed by server");
    this.buffer += this.decoder.decode(value, { stream: true });
  }

  async readLine(): Promise<string> {
    while (true) {
      const idx = this.buffer.indexOf("\r\n");
      if (idx !== -1) {
        const line = this.buffer.slice(0, idx);
        this.buffer = this.buffer.slice(idx + 2);
        return line;
      }
      await this.fill();
    }
  }

  // Reads a full SMTP response, including multi-line responses (e.g. "250-...\r\n250 OK\r\n")
  async readResponse(): Promise<{ code: number; text: string }> {
    const lines: string[] = [];
    let code = 0;
    while (true) {
      const line = await this.readLine();
      code = parseInt(line.slice(0, 3), 10);
      const isMultiLine = line[3] === "-";
      lines.push(line.slice(4));
      if (!isMultiLine) break;
    }
    if (code >= 400) {
      throw new Error(`SMTP error ${code}: ${lines.join(" ")}`);
    }
    return { code, text: lines.join("\n") };
  }

  release() {
    try {
      this.reader.releaseLock();
    } catch {
      // ignore if already released
    }
  }
}

function buildMimeMessage(
  data: CFEmailOptions,
  fromAddr: string,
  toAddrs: string[]
): string {
  const lines: string[] = [
    `From: ${data.from}`,
    `To: ${toAddrs.join(", ")}`,
    `Subject: ${data.subject}`,
    `MIME-Version: 1.0`,
    `Date: ${new Date().toUTCString()}`,
  ];

  if (data.html && data.text) {
    const boundary = `_boundary_${Math.random().toString(36).slice(2)}`;
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    lines.push("");
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: text/plain; charset=UTF-8`);
    lines.push("");
    lines.push(data.text);
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: text/html; charset=UTF-8`);
    lines.push("");
    lines.push(data.html);
    lines.push(`--${boundary}--`);
  } else if (data.html) {
    lines.push(`Content-Type: text/html; charset=UTF-8`);
    lines.push("");
    lines.push(data.html);
  } else {
    lines.push(`Content-Type: text/plain; charset=UTF-8`);
    lines.push("");
    lines.push(data.text ?? "");
  }

  return lines.join("\r\n");
}

export async function sendEmailViaCFSMTP(
  config: CFSMTPConfig,
  data: CFEmailOptions
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { connect } = await (import(/* webpackIgnore: true */ "cloudflare:sockets") as Promise<any>);

  const toAddrs = Array.isArray(data.to) ? data.to : [data.to];
  const fromMatch = data.from.match(/<([^>]+)>/);
  const fromAddr = fromMatch ? fromMatch[1] : data.from;

  // Step 1: Open plain TCP connection (for STARTTLS upgrade)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let socket: any = connect({ hostname: config.host, port: config.port });
  let smtpReader = new SMTPStreamReader(socket.readable);
  let writer = socket.writable.getWriter();

  const send = async (cmd: string) => {
    await writer.write(new TextEncoder().encode(cmd + "\r\n"));
  };

  try {
    await smtpReader.readResponse(); // 220 greeting

    await send(`EHLO rathagala.lk`);
    await smtpReader.readResponse(); // 250 capabilities

    await send("STARTTLS");
    await smtpReader.readResponse(); // 220 Go ahead

    // Step 2: Upgrade socket to TLS
    smtpReader.release();
    writer.releaseLock();
    socket = socket.startTls({ expectedServerHostname: config.host });
    smtpReader = new SMTPStreamReader(socket.readable);
    writer = socket.writable.getWriter();

    await send(`EHLO rathagala.lk`);
    await smtpReader.readResponse(); // 250 capabilities over TLS

    // Step 3: AUTH LOGIN
    await send("AUTH LOGIN");
    await smtpReader.readResponse(); // 334 (username prompt)
    await send(btoa(config.user));
    await smtpReader.readResponse(); // 334 (password prompt)
    await send(btoa(config.pass));
    await smtpReader.readResponse(); // 235 auth success

    // Step 4: Envelope
    await send(`MAIL FROM:<${fromAddr}>`);
    await smtpReader.readResponse(); // 250

    for (const to of toAddrs) {
      await send(`RCPT TO:<${to}>`);
      await smtpReader.readResponse(); // 250
    }

    // Step 5: Message body
    await send("DATA");
    await smtpReader.readResponse(); // 354

    const message = buildMimeMessage(data, fromAddr, toAddrs);
    // RFC 2821 dot-stuffing: lines starting with "." must be escaped to ".."
    const dotStuffed = message.replace(/^\.$/gm, "..");
    await writer.write(
      new TextEncoder().encode(dotStuffed + "\r\n.\r\n")
    );
    await smtpReader.readResponse(); // 250 queued

    await send("QUIT");
  } finally {
    smtpReader.release();
    try { writer.releaseLock(); } catch { /* already released */ }
    try { await socket.close(); } catch { /* ignore */ }
  }
}
