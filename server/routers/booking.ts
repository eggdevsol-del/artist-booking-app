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
            const conversation = await db.getConversationById(input.conversationId);
            if (!conversation) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });

            const artistSettings = await db.getArtistSettings(conversation.artistId);
            if (!artistSettings) throw new TRPCError({ code: "NOT_FOUND", message: "Artist settings not found" });

            // 1. Parse Schedule
            const workSchedule = BookingService.parseWorkSchedule(artistSettings.workSchedule);
            if (workSchedule.length === 0) {
                throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Work hours not set up" });
            }

            // 2. Validate Duration Constraints
            const maxDailyMinutes = BookingService.getMaxDailyMinutes(workSchedule);
            if (input.serviceDuration > maxDailyMinutes) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: `Service duration (${input.serviceDuration} min) exceeds your longest work day (${maxDailyMinutes} min).`
                });
            }

            // 3. Fetch Existing Appointments
            let searchStart = new Date(input.startDate);
            const now = new Date();
            if (searchStart < now) searchStart = now;
            searchStart.setHours(0, 0, 0, 0);

            const existingAppointments = await db.getAppointmentsForUser(
                conversation.artistId,
                "artist",
                searchStart
            );

            // 4. Calculate Dates
            const dates = BookingService.calculateProjectDates({
                serviceDuration: input.serviceDuration,
                sittings: input.sittings,
                frequency: input.frequency,
                startDate: input.startDate,
                workSchedule,
                existingAppointments
            });

            const totalCost = input.price * input.sittings;

            return { dates, totalCost };
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
