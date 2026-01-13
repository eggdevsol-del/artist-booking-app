import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const conversationsRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        const convos = await db.getConversationsForUser(
            ctx.user.id,
            ctx.user.role
        );

        // Fetch user details for each conversation
        const enriched = await Promise.all(
            convos.map(async (conv) => {
                const otherUserId =
                    ctx.user.role === "artist" ? conv.clientId : conv.artistId;
                const otherUser = await db.getUser(otherUserId);
                const unreadCount = await db.getUnreadMessageCount(conv.id, ctx.user.id);

                return {
                    ...conv,
                    otherUser,
                    unreadCount,
                };
            })
        );

        return enriched;
    }),
    getOrCreate: protectedProcedure
        .input(
            z.object({
                artistId: z.string(),
                clientId: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            let conversation = await db.getConversation(
                input.artistId,
                input.clientId
            );

            if (!conversation) {
                conversation = await db.createConversation(input);
            }

            return conversation;
        }),
    getById: protectedProcedure
        .input(z.number())
        .query(async ({ input, ctx }) => {
            const conversation = await db.getConversationById(input);

            if (!conversation) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Conversation not found",
                });
            }

            // Verify user is part of this conversation
            if (
                conversation.artistId !== ctx.user.id &&
                conversation.clientId !== ctx.user.id
            ) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Not authorized to view this conversation",
                });
            }

            // Get the other user's details
            const otherUserId =
                ctx.user.id === conversation.artistId
                    ? conversation.clientId
                    : conversation.artistId;
            const otherUser = await db.getUser(otherUserId);

            return {
                ...conversation,
                otherUser,
            };
        }),
    markAsRead: protectedProcedure
        .input(z.number())
        .mutation(async ({ input, ctx }) => {
            await db.markMessagesAsRead(input, ctx.user.id);
            return { success: true };
        }),
    pinConsultation: protectedProcedure
        .input(
            z.object({
                conversationId: z.number(),
                consultationId: z.number().nullable(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            // Verify ownership
            const conversation = await db.getConversationById(input.conversationId);
            if (!conversation) throw new TRPCError({ code: "NOT_FOUND" });

            // Only artist should be able to pin? Or both? User said "artist should have the option to Pin it"
            if (ctx.user.id !== conversation.artistId) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Only artists can pin consultations" });
            }

            // Update conversation
            await db.pinConsultation(input.conversationId, input.consultationId);

            return { success: true };
        }),
});
