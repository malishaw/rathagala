/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import {
  organization,
  twoFactor,
  admin as adminPlugin,
  openAPI,
  bearer
} from "better-auth/plugins";
import { ac, admin, member, owner } from "./permissions";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.titan.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mongodb"
  }),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      try {
        await transporter.sendMail({
          from: `"Rathagala Support" <${process.env.EMAIL_FROM || "support@rathagala.lk"}>`,
          to: user.email,
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
                    <p>Hello ${user.name || "there"},</p>
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
Hello ${user.name || "there"},

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
        console.log("Password reset email sent successfully to:", user.email);
      } catch (error) {
        console.error("Failed to send password reset email:", error);
        throw error;
      }
    },
  },
  plugins: [
    twoFactor(),
    adminPlugin(),
    openAPI(),
    bearer(),
    organization({
      ac: ac,
      roles: {
        member,
        admin,
        owner
      },

      allowUserToCreateOrganization(user) {
        // Allow all authenticated users to create organizations
        return !!user;
      },

      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.id}`;

        try {
          await transporter.sendMail({
            from: `"Rathagala Support" <${process.env.EMAIL_FROM || "support@rathagala.lk"}>`,
            to: data.email,
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
          });
          console.log("Organization invitation email sent successfully to:", data.email);
        } catch (error) {
          console.error("Failed to send organization invitation email:", error);
        }
      }
    })
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false
      },
      phone: {
        type: "string",
        required: false
      },
      whatsappNumber: {
        type: "string",
        required: false
      },
      province: {
        type: "string",
        required: false
      },
      district: {
        type: "string",
        required: false
      },
      city: {
        type: "string",
        required: false
      },
      location: {
        type: "string",
        required: false
      }
    }
  }
});

export type Session = typeof auth.$Infer.Session;
