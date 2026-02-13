
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

        // Manual Cascade Delete in a Transaction with increased timeout
        await prisma.$transaction(async (tx) => {
            // First, get all ad IDs created by this user
            const userAds = await tx.ad.findMany({
                where: { createdBy: userId },
                select: { id: true },
            });
            const adIds = userAds.map(ad => ad.id);

            // Step 1: Delete all relations of the user's ads
            if (adIds.length > 0) {
                // Use Promise.all to delete ad relations in parallel for better performance
                await Promise.all([
                    // Delete AdMedia (junction table between Ad and Media)
                    tx.adMedia.deleteMany({
                        where: { adId: { in: adIds } },
                    }),

                    // Delete AdAnalytics
                    tx.adAnalytics.deleteMany({
                        where: { adId: { in: adIds } },
                    }),

                    // Delete AdRevisions
                    tx.adRevision.deleteMany({
                        where: { adId: { in: adIds } },
                    }),

                    // Delete GeoHeatmap
                    tx.geoHeatmap.deleteMany({
                        where: { adId: { in: adIds } },
                    }),

                    // Delete ShareEvents
                    tx.shareEvent.deleteMany({
                        where: { adId: { in: adIds } },
                    }),

                    // Delete Payments related to these ads
                    tx.payment.deleteMany({
                        where: { adId: { in: adIds } },
                    }),

                    // Delete Favorites related to these ads
                    tx.favorite.deleteMany({
                        where: { adId: { in: adIds } },
                    }),

                    // Delete Reports related to these ads
                    tx.report.deleteMany({
                        where: { adId: { in: adIds } },
                    }),

                    // Delete Messages that reference these ads
                    tx.message.deleteMany({
                        where: { adId: { in: adIds } },
                    }),
                ]);

                // Now delete the ads themselves
                await tx.ad.deleteMany({
                    where: { id: { in: adIds } },
                });
            }

            // Step 2-11: Delete user-related data in parallel for better performance
            await Promise.all([
                // Delete user's uploaded media
                tx.media.deleteMany({
                    where: { uploaderId: userId },
                }),

                // Delete Reports made by user (not related to user's ads)
                tx.report.deleteMany({
                    where: { userId: userId },
                }),

                // Delete Notifications for User
                tx.userNotification.deleteMany({
                    where: { userId: userId },
                }),

                // Delete Messages (Sent & Received) - remaining ones not related to ads
                tx.message.deleteMany({
                    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
                }),

                // Delete Saved Searches
                tx.savedSearch.deleteMany({
                    where: { userId: userId },
                }),

                // Delete AuditLogs
                tx.auditLog.deleteMany({
                    where: { userId: userId },
                }),

                // Delete OrganizationFollowers
                tx.organizationFollower.deleteMany({
                    where: { userId: userId },
                }),

                // Delete Favorites (remaining ones)
                tx.favorite.deleteMany({
                    where: { userId: userId },
                }),

                // Delete Memberships
                tx.member.deleteMany({
                    where: { userId: userId },
                }),

                // Delete Invitations sent by this user
                tx.invitation.deleteMany({
                    where: { inviterId: userId },
                }),
            ]);

            // Step 12: Delete Accounts & Sessions
            await Promise.all([
                tx.account.deleteMany({ where: { userId: userId } }),
                tx.session.deleteMany({ where: { userId: userId } }),
                tx.twoFactor.deleteMany({ where: { userId: userId } }),
            ]);

            // Step 13: Finally, Delete User
            await tx.user.delete({
                where: { id: userId },
            });
        }, {
            maxWait: 10000, // 10 seconds to wait for a transaction slot
            timeout: 30000, // 30 seconds max transaction time
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
