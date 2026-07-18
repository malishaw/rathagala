import * as HttpStatusCodes from "stoker/http-status-codes";
import { db } from "@/server/db";
import { verificationCodes, users } from "@/server/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { AppRouteHandler } from "@/types/server";
import type { SendVerificationCodeRoute, VerifyCodeRoute } from "./verification.routes";
import { sendVerificationCode as sendCode, generateVerificationCode, sendWelcomeEmail, sendProfileCompletionReminderEmail } from "@/lib/email";

// Send verification code
export const sendVerificationCode: AppRouteHandler<SendVerificationCodeRoute> = async (c) => {
  const { email, name } = c.req.valid("json");

  console.log("Starting verification code send for:", email);

  try {
    // Generate 6-digit code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log("Generated code:", code, "Expires at:", expiresAt);

    // Delete old verification codes for this email
    await db.delete(verificationCodes).where(eq(verificationCodes.email, email));

    console.log("Deleted old codes for:", email);

    // Store verification code in database
    await db.insert(verificationCodes).values({
      email,
      code,
      expiresAt,
    });

    console.log("Stored verification code in database");

    // Send email
    try {
      await sendCode({ email, name, code });
      console.log("Verification code sent successfully to:", email);
    } catch (emailError) {
      console.error("Failed to send email, but code stored in DB:", emailError);
      // Still return success since code is stored in DB
      // User can resend if needed
    }

    return c.json(
      {
        success: true,
        message: "Verification code sent to your email",
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error in sendVerificationCode handler:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return c.json(
      {
        success: false,
        message: "Failed to send verification code",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    ) as any;
  }
};

// Verify code
export const verifyCode: AppRouteHandler<VerifyCodeRoute> = async (c) => {
  const { email, code } = c.req.valid("json");

  try {
    // Find verification code
    const verificationRecord = await db.query.verificationCodes.findFirst({
      where: and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.code, code),
        gte(verificationCodes.expiresAt, new Date())
      ),
      orderBy: (verificationCodes, { desc }) => [desc(verificationCodes.createdAt)],
    });

    if (!verificationRecord) {
      return c.json(
        {
          success: false,
          message: "Invalid or expired verification code",
        },
        HttpStatusCodes.BAD_REQUEST
      ) as any;
    }

    // Delete the used code
    await db.delete(verificationCodes).where(eq(verificationCodes.id, verificationRecord.id));

    // Update user's emailVerified status
    const [user] = await db.update(users)
      .set({ emailVerified: true })
      .where(eq(users.email, email))
      .returning();

    // Send welcome email after successful verification
    try {
      if (user) {
        await sendWelcomeEmail({ email, name: user.name });
      }
    } catch (emailError) {
      console.error("Failed to send welcome email, but verification succeeded:", emailError);
      // Don't fail the verification if welcome email fails
    }

    // Send profile completion reminder (non-blocking) — check which fields are missing
    if (user) {
      const missingFields: string[] = [];
      if (!user.image) missingFields.push("image");
      if (!user.phone) missingFields.push("phone");
      if (!user.whatsappNumber) missingFields.push("whatsappNumber");
      if (!user.province) missingFields.push("province");
      if (!user.district) missingFields.push("district");
      if (!user.city) missingFields.push("city");
      if (!user.location) missingFields.push("location");

      if (missingFields.length > 0) {
        sendProfileCompletionReminderEmail({ email, name: user.name || "User", missingFields }).catch((err) => {
          console.error("Failed to send profile completion reminder:", err);
        });
      }
    }

    return c.json(
      {
        success: true,
        message: "Email verified successfully",
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error verifying code:", error);
    return c.json(
      {
        success: false,
        message: "Failed to verify code",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    ) as any;
  }
};
