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

interface SendWelcomeEmailParams {
  email: string;
  name: string;
}

interface SendAdApprovalEmailParams {
  email: string;
  name: string;
  adTitle: string;
  adId: string;
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
                  <a href="${url}" class="button" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">Reset Password</a>
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
                  <a href="${inviteLink}" class="button" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">Accept Invitation</a>
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

export async function sendWelcomeEmail({ email, name }: SendWelcomeEmailParams) {
  try {
    await transporter.sendMail({
      from: `"Rathagala Support" <${process.env.EMAIL_FROM || "support@rathagala.lk"}>`,
      to: email,
      subject: "Welcome to Rathagala - Start Posting Ads!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .feature-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #024950; border-radius: 3px; }
              .button { display: inline-block; padding: 12px 30px; background-color: #024950; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .emoji { font-size: 24px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to Rathagala!</h1>
              </div>
              <div class="content">
                <p>Hello ${name},</p>
                <p><strong>Congratulations!</strong> Your email has been verified successfully. You're all set to start using Rathagala!</p>
                
                <h3 style="color: #024950; margin-top: 30px;">What you can do now:</h3>
                
                <div class="feature-box">
                  <span class="emoji">📝</span>
                  <strong>Post Ads:</strong> Start listing your vehicles and reach thousands of potential buyers.
                </div>
                
                <div class="feature-box">
                  <span class="emoji">🔍</span>
                  <strong>Browse Listings:</strong> Explore a wide range of vehicles available for sale.
                </div>
                
                <div class="feature-box">
                  <span class="emoji">💾</span>
                  <strong>Save Your Favorites:</strong> Keep track of ads you're interested in.
                </div>
                
                <div class="feature-box">
                  <span class="emoji">📊</span>
                  <strong>Manage Your Dashboard:</strong> Track your ads and monitor their performance.
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://rathagala.lk"}" class="button" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">Start Exploring</a>
                </div>
                
                <p style="margin-top: 30px;">If you have any questions or need assistance, our support team is here to help!</p>
                
                <p>Happy selling and buying!<br><strong>The Rathagala Team</strong></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                <p>Need help? Contact us at support@rathagala.lk</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Welcome to Rathagala!

Hello ${name},

Congratulations! Your email has been verified successfully. You're all set to start using Rathagala!

What you can do now:

📝 Post Ads: Start listing your vehicles and reach thousands of potential buyers.

🔍 Browse Listings: Explore a wide range of vehicles available for sale.

💾 Save Your Favorites: Keep track of ads you're interested in.

📊 Manage Your Dashboard: Track your ads and monitor their performance.

Visit: ${process.env.NEXT_PUBLIC_APP_URL || "https://rathagala.lk"}

If you have any questions or need assistance, our support team is here to help!

Happy selling and buying!
The Rathagala Team

© ${new Date().getFullYear()} Rathagala. All rights reserved.
Need help? Contact us at support@rathagala.lk
      `,
    });
    console.log("Welcome email sent successfully to:", email);
    return { success: true };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    throw error;
  }
}

export async function sendAdPostedEmail({ email, name, adTitle }: { email: string; name: string; adTitle: string }) {
  const phoneNumber = "0766220170";
  const displayPhoneNumber = "0766 220 170";
  const whatsappNumber = "94766220170";

  try {
    await transporter.sendMail({
      from: `"Rathagala Support" <${process.env.EMAIL_FROM || "support@rathagala.lk"}>`,
      to: email,
      subject: "Ad Submitted Successfully - Pending Approval",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .button { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold; font-size: 14px; }
              .whatsapp-btn { background-color: #25D366; color: white; }
              .phone-btn { background-color: #024950; color: white; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Ad Submitted Successfully!</h1>
              </div>
              <div class="content">
                <p>Hello ${name},</p>
                <p>Your ad "<strong>${adTitle}</strong>" has been submitted successfully.</p>
                <p>To publish your ad please send <strong>Your Name</strong> via SMS or WhatsApp through the provided mobile number to <strong>${displayPhoneNumber}</strong>. The ad will be successfully published after the mobile number verification.</p>
                <p style="text-align: center; margin: 25px 0;">
                  <a href="https://wa.me/${whatsappNumber}" class="button whatsapp-btn" style="display: inline-block; background-color: #25D366; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
                  <a href="tel:${phoneNumber}" class="button phone-btn" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold; font-size: 14px;">📞 ${displayPhoneNumber}</a>
                </p>
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

Your ad "${adTitle}" has been submitted successfully.

To publish your ad please send Your Name via SMS or WhatsApp through the provided mobile number to ${displayPhoneNumber}. The ad will be successfully published after the mobile number verification.

WhatsApp: https://wa.me/${whatsappNumber}
Call: ${phoneNumber}

Best regards,
The Rathagala Team

© ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `,
    });
    console.log("Ad posted email sent successfully to:", email);
    return { success: true };
  } catch (error) {
    console.error("Failed to send ad posted email:", error);
    throw error;
  }
}

// Send ad approval notification
interface SendAdApprovalEmailParams {
  email: string;
  name: string;
  adTitle: string;
  adId: string;
}

export async function sendAdApprovalEmail({ email, name, adTitle, adId }: SendAdApprovalEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rathagala.lk";

  try {
    await transporter.sendMail({
      from: `"Rathagala Support" <${process.env.EMAIL_FROM || "support@rathagala.lk"}>`,
      to: email,
      subject: "Your Ad has been Approved! - Rathagala",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .success-badge { background-color: #10b981; color: white; font-size: 16px; font-weight: bold; text-align: center; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .ad-title { background-color: #e0f2f1; padding: 15px; border-left: 4px solid #024950; margin: 20px 0; font-size: 18px; font-weight: bold; color: #024950; }
              .cta-button { display: inline-block; background-color: #024950; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold; }
              .link-list { margin: 20px 0; }
              .link-list a { color: #024950; text-decoration: none; font-weight: bold; }
              .link-list a:hover { text-decoration: underline; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Congratulations!</h1>
              </div>
              <div class="content">
                <p>Hello ${name},</p>
                <div class="success-badge">✓ Your Ad Has Been Approved</div>
                <p>Great news! Your ad has been reviewed and approved by our admin team.</p>
                <div class="ad-title">${adTitle}</div>
                <p>Your ad is now live and visible to all users on Rathagala. Potential buyers can now view and contact you about your listing.</p>
                <p style="text-align: center;">
                  <a href="${appUrl}/${adId}" class="cta-button" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold;">View Ad</a>
                </p>
                <div class="link-list">
                  <p>📋 <a href="${appUrl}/profile#my-ads" style="color: #024950 !important; text-decoration: none; font-weight: bold;">View My Ads</a></p>
                  <p>🚀 <a href="${appUrl}/profile#my-ads" style="color: #024950 !important; text-decoration: none; font-weight: bold;">Boost Your Ad</a></p>
                  <p>➕ <a href="${appUrl}/sell/new" style="color: #024950 !important; text-decoration: none; font-weight: bold;">Post Another Ad</a></p>
                </div>
                <p>Thank you for using Rathagala!</p>
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

🎉 Congratulations! Your Ad Has Been Approved

Great news! Your ad has been reviewed and approved by our admin team.

Ad Title: ${adTitle}

Your ad is now live and visible to all users on Rathagala. Potential buyers can now view and contact you about your listing.

View Ad: ${appUrl}/${adId}
View My Ads: ${appUrl}/profile#my-ads
Boost Your Ad: ${appUrl}/profile#my-ads
Post Another Ad: ${appUrl}/sell/new

Thank you for using Rathagala!

Best regards,
The Rathagala Team

© ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `,
    });
    console.log("Ad approval email sent successfully to:", email);
    return { success: true };
  } catch (error) {
    console.error("Failed to send ad approval email:", error);
    throw error;
  }
}

// Send ad rejection notification
interface SendAdRejectionEmailParams {
  email: string;
  name: string;
  adTitle: string;
  rejectionReason?: string;
}

export async function sendAdRejectionEmail({ email, name, adTitle, rejectionReason }: SendAdRejectionEmailParams) {
  try {
    await transporter.sendMail({
      from: `"Rathagala Support" <${process.env.EMAIL_FROM || "support@rathagala.lk"}>`,
      to: email,
      subject: "Your Ad Has Been Rejected - Rathagala",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #dc2626; color: white; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .ad-title { background-color: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; font-size: 18px; font-weight: bold; color: #7f1d1d; }
              .reason-box { background-color: white; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 3px; }
              .reason-label { font-weight: bold; color: #dc2626; margin-bottom: 8px; }
              .cta-button { display: inline-block; background-color: #024950; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Ad Rejection Notice</h2>
              </div>
              <div class="content">
                <p>Hello ${name},</p>
                <p>Unfortunately, your ad has been reviewed and rejected by our admin team.</p>
                <div class="ad-title">${adTitle}</div>
                
                ${rejectionReason ? `
                <div class="reason-box">
                  <div class="reason-label">Reason for Rejection:</div>
                  <p>${rejectionReason}</p>
                </div>
                ` : ''}
                
                <p><strong>What You Can Do:</strong></p>
                <ul>
                  <li>Review the rejection reason carefully</li>
                  <li>Make necessary corrections or updates to your ad</li>
                  <li>Resubmit your ad with the improvements</li>
                  <li>Contact our support team if you have questions about the rejection</li>
                </ul>
                
                <p style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://rathagala.lk"}/profile#my-ads" class="cta-button" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">View My Ads</a>
                </p>
                
                <p>If you believe this rejection was made in error or need further clarification, please contact our support team at support@rathagala.lk</p>
                
                <p>Thank you for your understanding.<br>The Rathagala Team</p>
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

Unfortunately, your ad has been reviewed and rejected by our admin team.

Ad Title: ${adTitle}

${rejectionReason ? `Reason for Rejection:
${rejectionReason}` : ''}

What You Can Do:
- Review the rejection reason carefully
- Make necessary corrections or updates to your ad
- Resubmit your ad with the improvements
- Contact our support team if you have questions about the rejection

If you believe this rejection was made in error or need further clarification, please contact our support team at support@rathagala.lk

Thank you for your understanding.
The Rathagala Team

© ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `,
    });
    console.log("Ad rejection email sent successfully to:", email);
    return { success: true };
  } catch (error) {
    console.error("Failed to send ad rejection email:", error);
    throw error;
  }
}

// Send 2-week ad notification
interface SendAdTwoWeekNotificationParams {
  email: string;
  name: string;
  adTitle: string;
  adId: string;
}

export async function sendAdTwoWeekNotification({ email, name, adTitle, adId }: SendAdTwoWeekNotificationParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rathagala.lk";

  try {
    await transporter.sendMail({
      from: `"Rathagala Support" <${process.env.EMAIL_FROM || "support@rathagala.lk"}>`,
      to: email,
      subject: `Your ad ${adTitle} has been live for 2 weeks! - Rathagala`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .ad-title { background-color: #e0f2f1; padding: 15px; border-left: 4px solid #024950; margin: 20px 0; font-size: 18px; font-weight: bold; color: #024950; }
              .action-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #e0e0e0; }
              .action-box a { color: #024950; font-weight: bold; text-decoration: none; }
              .action-box a:hover { text-decoration: underline; }
              .tips-list { margin: 20px 0; }
              .tips-list li { margin: 10px 0; }
              .tips-list a { color: #024950; font-weight: bold; text-decoration: none; }
              .tips-list a:hover { text-decoration: underline; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ 2-Week Ad Update</h1>
              </div>
              <div class="content">
                <p>Hello ${name},</p>
                <p>Two weeks have passed since you posted your ad:</p>
                <div class="ad-title">${adTitle}</div>
                
                <p><strong>Is your ad still valid?</strong></p>
                <div class="action-box">
                  <p>🗑️ If not, <a href="${appUrl}/profile#my-ads">click here to remove your ad</a></p>
                  <p>✏️ Or <a href="${appUrl}/${adId}/edit">click here to edit your ad</a></p>
                </div>
                <p>You can also manage your ads from your account's <a href="${appUrl}/profile#my-ads" style="color: #024950; font-weight: bold; text-decoration: none;">My Ads</a> page.</p>
                
                <p><strong>If you want to get more responses to your ad, here are some tips:</strong></p>
                <ol class="tips-list">
                  <li>🚀 <a href="${appUrl}/payments">Boost your ad</a> and make it stand out</li>
                  <li>💰 Rethink the price</li>
                  <li>📸 Add good-quality, original photos</li>
                  <li>📝 Add more details to the description</li>
                </ol>
                
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

Two weeks have passed since you posted your ad "${adTitle}".

Is your ad still valid?
- If not, click here to remove your ad: ${appUrl}/profile#my-ads
- Or click here to edit your ad: ${appUrl}/${adId}/edit

You can also manage your ads from your account's My Ads page: ${appUrl}/profile#my-ads

If you want to get more responses to your ad, here are some tips:
1. Boost your ad and make it stand out: ${appUrl}/payments
2. Rethink the price.
3. Add good-quality, original photos.
4. Add more details to the description.

Best regards,
The Rathagala Team

© ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `,
    });
    console.log("Ad 2-week notification email sent successfully to:", email);
    return { success: true };
  } catch (error) {
    console.error("Failed to send ad 2-week notification email:", error);
    throw error;
  }
}

// Generate a 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
