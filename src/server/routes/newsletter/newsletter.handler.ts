import { prisma } from "@/server/prisma/client";
import * as HttpStatusCodes from "stoker/http-status-codes";
import nodemailer from "nodemailer";

import type { AppRouteHandler } from "@/types/server";
import type { ListRoute, GetOneRoute, SendRoute, GetRecipientsRoute } from "./newsletter.routes";

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

// Helper to check admin role
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAdmin(user: any): boolean {
  return user?.role === "admin";
}

// ---------- List Newsletters ----------
export const list: AppRouteHandler<ListRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  const query = c.req.query();
  const page = Math.max(1, parseInt(query.page || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(query.limit || "10")));
  const search = query.search || "";
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (search) {
    where.subject = { contains: search, mode: "insensitive" };
  }

  const [newsletters, total] = await Promise.all([
    prisma.newsletter.findMany({
      where,
      orderBy: { sentAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.newsletter.count({ where }),
  ]);

  return c.json(
    {
      newsletters: newsletters.map((n) => ({
        ...n,
        id: n.id,
        sentAt: n.sentAt.toISOString(),
        createdAt: n.createdAt.toISOString(),
        plainContent: n.plainContent ?? null,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
    HttpStatusCodes.OK
  );
};

// ---------- Get One Newsletter ----------
export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { id } = c.req.param();

  const newsletter = await prisma.newsletter.findUnique({
    where: { id },
  });

  if (!newsletter) {
    return c.json({ message: "Newsletter not found" }, HttpStatusCodes.NOT_FOUND);
  }

  return c.json(
    {
      ...newsletter,
      sentAt: newsletter.sentAt.toISOString(),
      createdAt: newsletter.createdAt.toISOString(),
      plainContent: newsletter.plainContent ?? null,
    },
    HttpStatusCodes.OK
  );
};

// ---------- Send Newsletter ----------
export const send: AppRouteHandler<SendRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  const body = c.req.valid("json");
  const { subject, htmlContent, plainContent, recipientEmails } = body;

  // Wrap the HTML content in a nice email template
  const wrappedHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .email-header { background-color: #024950; color: white; padding: 20px; text-align: center; }
          .email-header h1 { margin: 0; font-size: 24px; }
          .email-body { padding: 30px; }
          .email-body h1 { font-size: 24px; }
          .email-body h2 { font-size: 20px; }
          .email-body h3 { font-size: 18px; }
          .email-body p { margin: 0 0 16px 0; }
          .email-body ul, .email-body ol { padding-left: 20px; margin: 0 0 16px 0; }
          .email-body img { max-width: 100%; height: auto; }
          .email-body a { color: #024950; }
          .email-footer { background-color: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-header">
            <h1>Rathagala</h1>
          </div>
          <div class="email-body">
            ${htmlContent}
          </div>
          <div class="email-footer">
            <p>&copy; ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
            <p>You are receiving this email because you are a registered user of Rathagala.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Send emails in batches to avoid overwhelming the SMTP server
  const BATCH_SIZE = 10;
  let sentCount = 0;

  for (let i = 0; i < recipientEmails.length; i += BATCH_SIZE) {
    const batch = recipientEmails.slice(i, i + BATCH_SIZE);
    const sendPromises = batch.map((email) =>
      transporter
        .sendMail({
          from: `"Rathagala" <${process.env.EMAIL_FROM || "support@rathagala.lk"}>`,
          to: email,
          subject,
          html: wrappedHtml,
          text: plainContent || subject,
        })
        .then(() => {
          sentCount++;
        })
        .catch((err) => {
          console.error(`Failed to send newsletter to ${email}:`, err);
        })
    );

    await Promise.all(sendPromises);
  }

  // Save the newsletter record
  const newsletter = await prisma.newsletter.create({
    data: {
      subject,
      htmlContent,
      plainContent: plainContent || null,
      recipientCount: sentCount,
      recipientEmails,
      sentBy: user.id,
    },
  });

  return c.json(
    {
      message: `Newsletter sent to ${sentCount} out of ${recipientEmails.length} recipients`,
      newsletter: {
        ...newsletter,
        sentAt: newsletter.sentAt.toISOString(),
        createdAt: newsletter.createdAt.toISOString(),
        plainContent: newsletter.plainContent ?? null,
      },
    },
    HttpStatusCodes.CREATED
  );
};

// ---------- Get Recipients ----------
export const getRecipients: AppRouteHandler<GetRecipientsRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const query = c.req.query();
  const search = query.search || "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  return c.json({ users }, HttpStatusCodes.OK);
};
