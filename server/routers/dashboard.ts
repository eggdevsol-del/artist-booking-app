import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import * as schema from "../../drizzle/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const dashboardRouter = router({
    getStats: protectedProcedure
        .query(async ({ ctx }) => {
            const { db, user } = ctx;

            if (user.role === 'artist' || user.role === 'admin') {
                // Artist Stats
                const [appointmentsToday] = await db
                    .select({ count: count() })
                    .from(schema.appointments)
                    .where(
                        and(
                            eq(schema.appointments.artistId, user.id),
                            sql`DATE(startTime) = CURDATE()`
                        )
                    );

                const [pendingRequests] = await db
                    .select({ count: count() })
                    .from(schema.consultations)
                    .where(
                        and(
                            eq(schema.consultations.artistId, user.id),
                            eq(schema.consultations.status, 'pending')
                        )
                    );

                // Simple revenue approximation (sum of prices of completed appointments)
                const [totalRevenue] = await db
                    .select({ value: sql<number>`SUM(${schema.appointments.price})` })
                    .from(schema.appointments)
                    .where(
                        and(
                            eq(schema.appointments.artistId, user.id),
                            eq(schema.appointments.status, 'completed')
                        )
                    );

                return {
                    role: 'artist',
                    stats: {
                        appointmentsToday: appointmentsToday.count,
                        pendingRequests: pendingRequests.count,
                        totalRevenue: totalRevenue.value || 0
                    }
                };

            } else {
                // Client Stats
                const [upcomingAppointments] = await db
                    .select({ count: count() })
                    .from(schema.appointments)
                    .where(
                        and(
                            eq(schema.appointments.clientId, user.id),
                            eq(schema.appointments.status, 'confirmed'),
                            sql`startTime > NOW()`
                        )
                    );

                const [activeVouchers] = await db
                    .select({ count: count() })
                    .from(schema.issuedVouchers)
                    .where(
                        and(
                            eq(schema.issuedVouchers.clientId, user.id),
                            eq(schema.issuedVouchers.status, 'active')
                        )
                    );

                return {
                    role: 'client',
                    stats: {
                        upcomingAppointments: upcomingAppointments.count,
                        activeVouchers: activeVouchers.count
                    }
                };
            }
        }),

    getRecentActivity: protectedProcedure
        .query(async ({ ctx }) => {
            const { db, user } = ctx;
            // Fetch recent 5 items (mix of appointments or consultations)
            // Simplified for now: just return recent consultations
            const interactions = await db.query.consultations.findMany({
                where: user.role === 'artist'
                    ? eq(schema.consultations.artistId, user.id)
                    : eq(schema.consultations.clientId, user.id),
                orderBy: desc(schema.consultations.updatedAt),
                limit: 5,
                with: {
                    conversation: true
                }
            });

            return interactions;
        })
});
