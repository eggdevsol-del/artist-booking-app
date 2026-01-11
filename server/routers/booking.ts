import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { artistProcedure, router } from "../_core/trpc";
import * as db from "../db";
import * as BookingService from "../services/booking.service";

export const bookingRouter = router({
    checkAvailability: artistProcedure
        .input(z.object({
            conversationId: z.number(),
            serviceName: z.string(),
            serviceDuration: z.number(),
            sittings: z.number(),
            price: z.number(),
            frequency: z.enum(["consecutive", "weekly", "biweekly", "monthly"]),
            startDate: z.date(),
        }))
        .query(async ({ input }) => {
            const { conversationId, frequency, sittings, serviceDuration } = input;

            try {
                console.log("[BookingRouter] Checking availability for:", { conversationId, frequency, sittings });

                const conversation = await db.getConversationById(conversationId);

                if (!conversation) {
                    console.error("[BookingRouter] Conversation not found");
                    throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
                }

                const artistSettings = await db.getArtistSettings(conversation.artistId);

                console.log("[BookingRouter] Artist Settings found:", !!artistSettings);

                if (!artistSettings) {
                    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Artist has not configured settings" });
                }

                // 1. Parse Schedule
                const workSchedule = BookingService.parseWorkSchedule(artistSettings.workSchedule);
                console.log("[BookingRouter] Work Schedule parsed, days enabled:", workSchedule.filter(d => d.enabled).length);

                // 2. Validate Duration Constraints
                const maxDailyMinutes = BookingService.getMaxDailyMinutes(workSchedule);
                if (serviceDuration > maxDailyMinutes) {
                    throw new TRPCError({
                        code: "PRECONDITION_FAILED",
                        message: `Service duration (${serviceDuration} min) exceeds your longest work day (${maxDailyMinutes} min).`
                    });
                }

                // 3. Fetch Existing Appointments
                // Use getAppointmentsForUser which supports fromDate
                const searchStart = new Date(input.startDate);

                const existingAppointments = await db.getAppointmentsForUser(
                    conversation.artistId,
                    "artist",
                    searchStart
                );

                console.log("[BookingRouter] Existing appointments count:", existingAppointments.length);

                // 4. Calculate Dates
                const dates = BookingService.calculateProjectDates({
                    serviceDuration,
                    sittings,
                    frequency,
                    startDate: input.startDate,
                    workSchedule,
                    existingAppointments,
                });

                console.log("[BookingRouter] Calculation success, dates found:", dates.length);

                const totalCost = input.price * input.sittings;

                return {
                    dates,
                    totalCost,
                };
            } catch (error) {
                console.error("[BookingRouter] Error in checkAvailability:", error);
                throw error;
            }
        }),

    // Migration of the bookProject mutation
    bookProject: artistProcedure
        .input(z.object({
            conversationId: z.number(),
            appointments: z.array(z.object({
                startTime: z.date(),
                endTime: z.date(),
                title: z.string(),
                description: z.string().optional(),
                serviceName: z.string(),
                price: z.number(),
                depositAmount: z.number().optional(),
            })),
        }))
        .mutation(async ({ input }) => {
            const conversation = await db.getConversationById(input.conversationId);
            if (!conversation) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });

            let createdCount = 0;
            for (const appt of input.appointments) {
                await db.createAppointment({
                    conversationId: input.conversationId,
                    artistId: conversation.artistId,
                    clientId: conversation.clientId,
                    title: appt.title,
                    description: appt.description,
                    startTime: appt.startTime,
                    endTime: appt.endTime,
                    serviceName: appt.serviceName,
                    price: appt.price,
                    depositAmount: appt.depositAmount,
                    status: "pending",
                });
                createdCount++;
            }

            return { success: true, count: createdCount };
        })
});
