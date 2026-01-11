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
                if (parsedSchedule && typeof parsedSchedule === 'object' && !Array.isArray(parsedSchedule)) {
                    workSchedule = Object.entries(parsedSchedule).map(([key, value]: [string, any]) => ({
                        day: key.charAt(0).toUpperCase() + key.slice(1),
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
                const startStr = day.start || day.startTime;
                const endStr = day.end || day.endTime;

                const s = parseTime(startStr);
                const e = parseTime(endStr);

                if (!s || !e) return max;

                let startMins = s.hour * 60 + s.minute;
                let endMins = e.hour * 60 + e.minute;

                if (endMins < startMins) endMins += 24 * 60; // Handle overnight

                const minutes = endMins - startMins;
                return Math.max(max, minutes);
            }, 0);

            if (input.serviceDuration > maxDailyMinutes) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: `Service duration (${input.serviceDuration} min) exceeds your longest work day (${maxDailyMinutes} min).`
                });
            }

            // Fetch existing appointments for the artist relative to now to catch all future info
            // Ensure we use a date that covers potential overlap with the start date
            let searchStart = new Date(input.startDate);
            const now = new Date();
            if (searchStart < now) searchStart = now;
            searchStart.setHours(0, 0, 0, 0);

            const existingAppointments = await db.getAppointmentsForUser(
                conversation.artistId,
                "artist",
                searchStart
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
                // Find next available slot
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

                // Strictly enforce that the FIRST sitting must be on the selected Start Date
                // We compare the YYYY-MM-DD parts.
                if (i === 0) {
                    const slotDate = new Date(slot);
                    // Use input.startDate for comparison as currentDateSearch might have been adjusted if it was in the past
                    // But here we care about the user's intent.
                    // Actually, if the user picks a date in the past, currentDateSearch becomes today/now.
                    // If user picks valid future date, currentDateSearch starts at that date.

                    // We should check against the *intended* start date if it's in the future.
                    // If input.startDate is in the past, then the user effectively asked for "ASAP starting today", so any slot today is valid.
                    // If input.startDate is in the future, we want the slot to be on that specific date.

                    const userRequestedStart = new Date(input.startDate);
                    const isFutureStart = userRequestedStart >= new Date();

                    if (isFutureStart) {
                        const slotDateString = slotDate.toLocaleDateString();
                        const requestDateString = userRequestedStart.toLocaleDateString();

                        // We can also check day/month/year parts to be locale-safe
                        const sameDay = slotDate.getDate() === userRequestedStart.getDate() &&
                            slotDate.getMonth() === userRequestedStart.getMonth() &&
                            slotDate.getFullYear() === userRequestedStart.getFullYear();

                        if (!sameDay) {
                            throw new TRPCError({
                                code: "PRECONDITION_FAILED",
                                message: `The selected start date is unavailable or fully booked. Please select a new start date.`,
                            });
                        }
                    }
                }

                suggestedDates.push(slot);

                // Add to existing appointments to prevent overlap with consecutive sittings
                existingAppointments.push({
                    startTime: new Date(slot),
                    endTime: new Date(slot.getTime() + input.serviceDuration * 60000)
                });

                // Calculate next search date based on frequency
                const nextDate = new Date(slot);
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

// Helper to parse time strings like "14:30" or "02:30 PM"
function parseTime(timeStr: string): { hour: number; minute: number } | null {
    if (!timeStr) return null;
    try {
        const normalized = timeStr.trim().toUpperCase();
        let hour = 0;
        let minute = 0;

        const isPM = normalized.includes("PM");
        const isAM = normalized.includes("AM");

        const cleanTime = normalized.replace("PM", "").replace("AM", "").trim();
        const parts = cleanTime.split(":");

        if (parts.length < 2) return null;

        hour = parseInt(parts[0], 10);
        minute = parseInt(parts[1], 10);

        if (isNaN(hour) || isNaN(minute)) return null;

        if (isPM && hour < 12) hour += 12;
        if (isAM && hour === 12) hour = 0;

        return { hour, minute };
    } catch (e) {
        return null; // Fail safe
    }
}

// Helper function to find next available slot
function findNextAvailableSlot(
    startDate: Date,
    durationMinutes: number,
    workSchedule: any[],
    existingAppointments: any[]
): Date | null {
    const MAX_SEARCH_DAYS = 365;
    let current = new Date(startDate);
    const now = new Date();

    if (current < now) {
        current = new Date(now);
        const remainder = current.getMinutes() % 30;
        if (remainder !== 0) {
            current.setMinutes(current.getMinutes() + (30 - remainder));
        }
        current.setSeconds(0);
        current.setMilliseconds(0);
    }

    for (let dayOffset = 0; dayOffset < MAX_SEARCH_DAYS; dayOffset++) {
        const dayName = current.toLocaleDateString("en-US", { weekday: "long" });
        const schedule = workSchedule.find((d: any) => d.day === dayName);

        if (schedule && schedule.enabled) {
            const startStr = schedule.start || schedule.startTime;
            const endStr = schedule.end || schedule.endTime;

            const startParsed = parseTime(startStr);
            const endParsed = parseTime(endStr);

            if (startParsed && endParsed) {
                const dayStart = new Date(current);
                dayStart.setHours(startParsed.hour, startParsed.minute, 0, 0);

                const dayEnd = new Date(current);
                dayEnd.setHours(endParsed.hour, endParsed.minute, 0, 0);

                if (current < dayStart) {
                    current.setTime(dayStart.getTime());
                }

                while (current.getTime() + durationMinutes * 60000 <= dayEnd.getTime()) {
                    const potentialEnd = new Date(current.getTime() + durationMinutes * 60000);

                    const hasCollision = existingAppointments.some((appt: any) => {
                        const apptStart = new Date(appt.startTime);
                        const apptEnd = new Date(appt.endTime);
                        return current < apptEnd && potentialEnd > apptStart;
                    });

                    if (!hasCollision) {
                        return new Date(current);
                    }

                    // Increment by 30 mins
                    current.setTime(current.getTime() + 30 * 60000);
                }
            }
        }

        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0, 0);
    }

    return null;
}
