
import { auth } from "@/lib/auth";
import { prisma } from "@/server/prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user || session.user.role !== "admin") {
            return NextResponse.json(
                { message: "Unauthorized: Admin access required" },
                { status: 403 }
            );
        }

        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { message: "User ID is required" },
                { status: 400 }
            );
        }

        // Manual Cascade Delete in a Transaction
        await prisma.$transaction(async (tx) => {
            // 1. Delete associated Media
            await tx.media.deleteMany({
                where: { uploaderId: userId },
            });

            // 2. Delete Ads (and their relations if needed, but Ad has its own cascades usually? No, we checking schema before)
            // We need to delete things that point TO Ads first if they don't cascade, but usually Ad deletion handles its children if configured.
            // However, we are deleting the User, so we must delete Ads created by the User.
            // And we must delete things linked to those Ads if they don't cascade from Ad deletion.
            // Let's assume standard dependencies:

            // Delete Payments linked to User
            await tx.payment.deleteMany({
                where: { userId: userId },
            });

            // Delete Reports by User
            await tx.report.deleteMany({
                where: { userId: userId },
            });

            // Delete Notifications for User
            await tx.userNotification.deleteMany({
                where: { userId: userId },
            });

            // Delete Messages (Sent & Received)
            await tx.message.deleteMany({
                where: { OR: [{ senderId: userId }, { receiverId: userId }] },
            });

            // Delete Saved Searches
            await tx.savedSearch.deleteMany({
                where: { userId: userId },
            });

            // Delete AuditLogs
            await tx.auditLog.deleteMany({
                where: { userId: userId },
            });

            // Delete OrganizationFollowers
            await tx.organizationFollower.deleteMany({
                where: { userId: userId },
            });

            // Delete Favorites
            await tx.favorite.deleteMany({
                where: { userId: userId },
            });

            // Delete Memberships
            await tx.member.deleteMany({
                where: { userId: userId },
            });

            // Delete Accounts & Sessions (Usually cascade from User in schema, but good to be safe)
            await tx.account.deleteMany({ where: { userId: userId } });
            await tx.session.deleteMany({ where: { userId: userId } });

            // Find Ads created by user to delete them. 
            // Note: Ad deletion might fail if there are other things pointing to Ad that restrict deletion.
            // But for now, let's delete the Ads.
            await tx.ad.deleteMany({
                where: { createdBy: userId },
            });

            // Finally, Delete User
            await tx.user.delete({
                where: { id: userId },
            });
        });

        return NextResponse.json(
            { message: "User and associated data deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { message: "Failed to delete user", error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
