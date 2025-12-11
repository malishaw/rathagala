import nodemailer from "nodemailer";

// Debug: Log SMTP configuration (hide password for security)
console.log("SMTP Configuration:", {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  passLength: process.env.SMTP_PASS?.length,
  passFirstChar: process.env.SMTP_PASS?.[0],
  passLastChar: process.env.SMTP_PASS?.[process.env.SMTP_PASS.length - 1],
});

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.titan.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendVerificationCodeParams {
  email: string;
  name: string;
  code: string;
}

interface SendPasswordResetParams {
  email: string;
  name: string;
  url: string;
}

interface SendOrganizationInviteParams {
  email: string;
  inviteLink: string;
}

export async function sendVerificationCode({ email, name, code }: SendVerificationCodeParams) {
  try {
    await transporter.sendMail({
      from: `"Rathagala Support" <${process.env.EMAIL_FROM || "support@rathagala.lk"}>`,
      to: email,
      subject: "Verify Your Email - Rathagala",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .code-box { background-color: #024950; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 5px; margin: 20px 0; letter-spacing: 8px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Rathagala!</h1>
              </div>
              <div class="content">
                <p>Hello ${name},</p>
                <p>Thank you for signing up! Please use the verification code below to complete your registration.</p>
                <div class="code-box">${code}</div>
                <p><strong>This code will expire in 10 minutes.</strong></p>
                <p>If you didn't create an account, you can safely ignore this email.</p>
                <p>Best regards,<br>The Rathagala Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                <p>If you have any questions, contact us at support@rathagala.lk</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Hello ${name},

Thank you for signing up! Please use the verification code below to complete your registration.

Verification Code: ${code}

This code will expire in 10 minutes.

If you didn't create an account, you can safely ignore this email.

Best regards,
The Rathagala Team

© ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `,
    });
    console.log("Verification code email sent successfully to:", email);
    return { success: true };
  } catch (error) {
    console.error("Failed to send verification code email:", error);
    throw error;
  }
}

export async function sendPasswordResetEmail({ email, name, url }: SendPasswordResetParams) {
  try {
    await transporter.sendMail({
      from: `"Rathagala Support" <${process.env.EMAIL_FROM || "support@rathagala.lk"}>`,
      to: email,
      subject: "Reset Your Password - Rathagala",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .button { display: inline-block; padding: 12px 30px; background-color: #024950; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hello ${name},</p>
                <p>We received a request to reset your password for your Rathagala account.</p>
                <p>Click the button below to reset your password:</p>
                <p style="text-align: center;">
                  <a href="${url}" class="button">Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #024950;">${url}</p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request a password reset, you can safely ignore this email.</p>
                <p>Best regards,<br>The Rathagala Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                <p>If you have any questions, contact us at support@rathagala.lk</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Hello ${name},

We received a request to reset your password for your Rathagala account.

Click the link below to reset your password:
${url}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

Best regards,
The Rathagala Team

© ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `,
    });
    console.log("Password reset email sent successfully to:", email);
    return { success: true };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
}

export async function sendOrganizationInvite({ email, inviteLink }: SendOrganizationInviteParams) {
  try {
    await transporter.sendMail({
      from: `"Rathagala Support" <${process.env.EMAIL_FROM || "support@rathagala.lk"}>`,
      to: email,
      subject: "Organization Invitation - Rathagala",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .button { display: inline-block; padding: 12px 30px; background-color: #024950; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Organization Invitation</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>You have been invited to join an organization on Rathagala.</p>
                <p>Click the button below to accept the invitation:</p>
                <p style="text-align: center;">
                  <a href="${inviteLink}" class="button">Accept Invitation</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #024950;">${inviteLink}</p>
                <p>Best regards,<br>The Rathagala Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                <p>If you have any questions, contact us at support@rathagala.lk</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Hello,

You have been invited to join an organization on Rathagala.

Click the link below to accept the invitation:
${inviteLink}

Best regards,
The Rathagala Team

© ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `,
    });
    console.log("Organization invitation email sent successfully to:", email);
    return { success: true };
  } catch (error) {
    console.error("Failed to send organization invitation email:", error);
    throw error;
  }
}

// Generate a 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
