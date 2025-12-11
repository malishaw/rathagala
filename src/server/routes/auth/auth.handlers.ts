import * as HttpStatusCodes from "stoker/http-status-codes";
import { prisma } from "@/server/prisma/client";
import { AppRouteHandler } from "@/types/server";
import type { SendVerificationCodeRoute, VerifyCodeRoute } from "./verification.routes";
import { sendVerificationCode as sendCode, generateVerificationCode } from "@/lib/email";

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
    await prisma.verificationCode.deleteMany({
      where: { email },
    });

    console.log("Deleted old codes for:", email);

    // Store verification code in database
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt,
      },
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
    );
  }
};

// Verify code
export const verifyCode: AppRouteHandler<VerifyCodeRoute> = async (c) => {
  const { email, code } = c.req.valid("json");

  try {
    // Find verification code
    const verificationRecord = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!verificationRecord) {
      return c.json(
        {
          success: false,
          message: "Invalid or expired verification code",
        },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Delete the used code
    await prisma.verificationCode.delete({
      where: {
        id: verificationRecord.id,
      },
    });

    // Update user's emailVerified status
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

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
    );
  }
};
