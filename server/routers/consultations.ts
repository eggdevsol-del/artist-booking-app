import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const consultationsRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        return db.getConsultationsForUser(ctx.user.id, ctx.user.role);
    }),
    create: protectedProcedure
        .input(
            z.object({
                artistId: z.string(),
                subject: z.string(),
                description: z.string(),
                preferredDate: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return db.createConsultation({
                clientId: ctx.user.id,
                artistId: input.artistId,
                subject: input.subject,
                description: input.description,
                preferredDate: input.preferredDate ? new Date(input.preferredDate) : undefined,
            });
        }),
    update: protectedProcedure
        .input(
            z.object({
                id: z.number(),
                status: z
                    .enum(["pending", "scheduled", "completed", "cancelled"])
                    .optional(),
                conversationId: z.number().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const consultation = await db.getConsultation(input.id);

            if (!consultation) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Consultation not found",
                });
            }

            // Verify user is part of this consultation
            if (
                consultation.artistId !== ctx.user.id &&
                consultation.clientId !== ctx.user.id
            ) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Not authorized to update this consultation",
                });
            }

            const { id, ...updates } = input;
            return db.updateConsultation(id, updates);
        }),
});
