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
});
