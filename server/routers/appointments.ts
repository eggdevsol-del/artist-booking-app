import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { artistProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const appointmentsRouter = router({
    list: protectedProcedure
        .input(
            z.object({
                startDate: z.date().optional(),
                endDate: z.date().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            return db.getAppointmentsForUser(
                ctx.user.id,
                ctx.user.role,
                input.startDate,
                input.endDate
            );
        }),
    getByConversation: protectedProcedure
        .input(z.number())
        .query(async ({ input, ctx }) => {
            // Verify user is part of this conversation
            const conversation = await db.getConversationById(input);

            if (!conversation) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Conversation not found",
                });
            }

            if (
                conversation.artistId !== ctx.user.id &&
                conversation.clientId !== ctx.user.id
            ) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Not authorized to view these appointments",
                });
            }

            return db.getAppointmentsByConversation(input);
        }),
    create: protectedProcedure
        .input(
            z.object({
                conversationId: z.number(),
                artistId: z.string(),
                clientId: z.string(),
                title: z.string(),
                description: z.string().optional(),
                startTime: z.date(),
                endTime: z.date(),
                serviceName: z.string().optional(),
                price: z.number().optional(),
                depositAmount: z.number().optional(),
            })
        )
        .mutation(async ({ input }) => {
            return db.createAppointment({
                ...input,
                status: "pending",
            });
        }),
    update: protectedProcedure
        .input(
            z.object({
                id: z.number(),
                title: z.string().optional(),
                description: z.string().optional(),
                startTime: z.date().optional(),
                endTime: z.date().optional(),
                status: z
                    .enum(["pending", "confirmed", "cancelled", "completed"])
                    .optional(),
                serviceName: z.string().optional(),
                price: z.number().optional(),
                depositAmount: z.number().optional(),
                depositPaid: z.boolean().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const appointment = await db.getAppointment(input.id);

            if (!appointment) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Appointment not found",
                });
            }

            // Verify user is part of this appointment
            if (
                appointment.artistId !== ctx.user.id &&
                appointment.clientId !== ctx.user.id
            ) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Not authorized to update this appointment",
                });
            }

            const { id, ...updates } = input;
            return db.updateAppointment(id, updates);
        }),
    delete: protectedProcedure
        .input(z.number())
        .mutation(async ({ input, ctx }) => {
            const appointment = await db.getAppointment(input);

            if (!appointment) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Appointment not found",
                });
            }

            // Verify user is part of this appointment
            if (
                appointment.artistId !== ctx.user.id &&
                appointment.clientId !== ctx.user.id
            ) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Not authorized to delete this appointment",
                });
            }

            return db.deleteAppointment(input);
        }),

    confirmDeposit: artistProcedure
        .input(z.object({
            conversationId: z.number(),
            paymentProof: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Get all pending appointments for this conversation
            const pendingAppointments = await db.getPendingAppointmentsByConversation(input.conversationId);

            if (!pendingAppointments || pendingAppointments.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No pending appointments found",
                });
            }

            // Confirm all pending appointments
            await db.confirmAppointments(input.conversationId, input.paymentProof);

            // TODO: Send push notification to client
            // TODO: Schedule reminder notifications

            return { success: true, count: pendingAppointments.length };
        }),

    findProjectAvailability: artistProcedure
        .input(z.object({
            conversationId: z.number(),
            serviceName: z.string(),
            serviceDuration: z.number(),
            sittings: z.number(),
            frequency: z.enum(["consecutive", "weekly", "biweekly", "monthly"]),
            startDate: z.date(),
        }))
        .query(async ({ ctx, input }) => {
            const conversation = await db.getConversationById(input.conversationId);
            if (!conversation) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });

            const artistSettings = await db.getArtistSettings(conversation.artistId);
            if (!artistSettings) throw new TRPCError({ code: "NOT_FOUND", message: "Artist settings not found" });

            let workSchedule: any[] = [];
            try {
                const parsedSchedule = JSON.parse(artistSettings.workSchedule);
                // Check if it's an object (new format) or array (old format if any)
                if (parsedSchedule && typeof parsedSchedule === 'object' && !Array.isArray(parsedSchedule)) {
                    // Convert object { monday: {...} } to array [ { day: 'Monday', ... } ]
                    workSchedule = Object.entries(parsedSchedule).map(([key, value]: [string, any]) => ({
                        day: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize: monday -> Monday
                        ...value
                    }));
                } else if (Array.isArray(parsedSchedule)) {
                    workSchedule = parsedSchedule;
                }
            } catch (e) {
                console.error("Failed to parse work schedule");
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Invalid work schedule format" });
            }

            if (!workSchedule || workSchedule.length === 0) {
                throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Work hours not set up" });
            }

            // Validation: Check if service fits in ANY work day
            const maxDailyMinutes = workSchedule.reduce((max, day) => {
                if (!day.enabled) return max;
                if (!day.start && !day.startTime) return max; // handle potential missing keys if format varies

                // Handle different key names. The verified format uses 'start' and 'end', 
                // but the previous code used 'startTime' and 'endTime'.
                const start = day.start || day.startTime;
                const end = day.end || day.endTime;

                if (!start || !end) return max;

                const [startH, startM] = start.split(":").map(Number);
                const [endH, endM] = end.split(":").map(Number);
                const minutes = (endH * 60 + endM) - (startH * 60 + startM);
                return Math.max(max, minutes);
            }, 0);

            if (input.serviceDuration > maxDailyMinutes) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: `Service duration (${input.serviceDuration} min) exceeds your longest work day (${maxDailyMinutes} min).`
                });
            }

            // Fetch existing appointments for the artist relative to the start date
            const existingAppointments = await db.getAppointmentsForUser(
                conversation.artistId,
                "artist",
                input.startDate
            );

            const suggestedDates: Date[] = [];
            let currentDateSearch = new Date(input.startDate);
            // Ensure we start searching from the start date, or now if start date is past
            if (currentDateSearch < new Date()) {
                currentDateSearch = new Date();
                currentDateSearch.setMinutes(Math.ceil(currentDateSearch.getMinutes() / 30) * 30);
                currentDateSearch.setSeconds(0);
                currentDateSearch.setMilliseconds(0);
            }

            for (let i = 0; i < input.sittings; i++) {
                // Find next available slot starting from currentDateSearch
                const slot = findNextAvailableSlot(
                    currentDateSearch,
                    input.serviceDuration,
                    workSchedule,
                    existingAppointments
                );

                if (!slot) {
                    throw new TRPCError({
                        code: "PRECONDITION_FAILED",
                        message: `Could not find available slot for sitting ${i + 1} within the next year. Check your calendar availability.`,
                    });
                }

                suggestedDates.push(slot);

                // Calculate next search date based on frequency
                const nextDate = new Date(slot);
                // Ensure we advance at least by the duration of the current appt + buffer, or simply the next day for consecutive

                switch (input.frequency) {
                    case "consecutive":
                        nextDate.setDate(nextDate.getDate() + 1);
                        break;
                    case "weekly":
                        nextDate.setDate(nextDate.getDate() + 7);
                        break;
                    case "biweekly":
                        nextDate.setDate(nextDate.getDate() + 14);
                        break;
                    case "monthly":
                        nextDate.setMonth(nextDate.getMonth() + 1);
                        break;
                }

                // Reset to start of day for broader search on the next target day
                nextDate.setHours(0, 0, 0, 0);
                currentDateSearch = nextDate;
            }

            return { dates: suggestedDates };
        }),

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
        .mutation(async ({ ctx, input }) => {
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
        }),
});

// Helper function to find next available slot
function findNextAvailableSlot(
    startDate: Date,
    durationMinutes: number,
    workSchedule: any[],
    existingAppointments: any[]
): Date | null {
    const MAX_SEARCH_DAYS = 365; // Avoid infinite loops
    let current = new Date(startDate);

    // Normalize to start of day if it's in the past (though input should be future)
    const now = new Date();
    if (current < now) {
        current = new Date(now);
        current.setMinutes(Math.ceil(current.getMinutes() / 30) * 30); // Round up to next 30 min
        current.setSeconds(0);
        current.setMilliseconds(0);
    }

    for (let dayOffset = 0; dayOffset < MAX_SEARCH_DAYS; dayOffset++) {
        const dayName = current.toLocaleDateString("en-US", { weekday: "long" });
        const schedule = workSchedule.find((d: any) => d.day === dayName);

        if (schedule && schedule.enabled) {
            // Parse work hours - handle both naming conventions
            const startStr = schedule.start || schedule.startTime;
            const endStr = schedule.end || schedule.endTime;

            if (startStr && endStr) {
                const [startHour, startMinute] = startStr.split(":").map(Number);
                const [endHour, endMinute] = endStr.split(":").map(Number);

                const dayStart = new Date(current);
                dayStart.setHours(startHour, startMinute, 0, 0);

                const dayEnd = new Date(current);
                dayEnd.setHours(endHour, endMinute, 0, 0);

                // If current time is before work start, jump to start
                if (current < dayStart) {
                    current = new Date(dayStart);
                }

                // Iterate through slots in 30 min increments
                while (current.getTime() + durationMinutes * 60000 <= dayEnd.getTime()) {
                    const potentialEnd = new Date(current.getTime() + durationMinutes * 60000);

                    // Check collision
                    const hasCollision = existingAppointments.some((appt) => {
                        const apptStart = new Date(appt.startTime);
                        const apptEnd = new Date(appt.endTime);
                        // Check overlap
                        return (
                            (current < apptEnd && potentialEnd > apptStart)
                        );
                    });

                    if (!hasCollision) {
                        return new Date(current);
                    }

                    // Increment by 30 mins
                    current.setTime(current.getTime() + 30 * 60000);
                }
            }
        }

        // Move to start of next day
        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0, 0);
    }

    return null;
}
