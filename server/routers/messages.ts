import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { notifyAppointmentConfirmed, notifyNewMessage } from "../_core/pushNotification";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const messagesRouter = router({
    list: protectedProcedure
        .input(
            z.object({
                conversationId: z.number(),
                limit: z.number().optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            // Verify user is part of this conversation
            const conversation = await db.getConversationById(
                input.conversationId
            );

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
                    message: "Not authorized to view these messages",
                });
            }

            const msgs = await db.getMessages(
                input.conversationId,
                input.limit
            );
            return msgs.reverse(); // Return in chronological order
        }),
    send: protectedProcedure
        .input(
            z.object({
                conversationId: z.number(),
                content: z.string(),
                messageType: z
                    .enum(["text", "system", "appointment_request", "appointment_confirmed", "image"])
                    .default("text"),
                metadata: z.string().optional(),
                consultationId: z.number().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            // Verify user is part of this conversation
            const conversation = await db.getConversationById(
                input.conversationId
            );

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
                    message: "Not authorized to send messages in this conversation",
                });
            }

            const message = await db.createMessage({
                conversationId: input.conversationId,
                senderId: ctx.user.id,
                content: input.content,
                messageType: input.messageType,
                metadata: input.metadata,
            });

            // Send push notification to the other user
            const recipientId = conversation.artistId === ctx.user.id
                ? conversation.clientId
                : conversation.artistId;

            // Only send push for regular messages (not system messages)
            if (input.messageType === "text" || input.messageType === "image") {
                const messagePreview = input.messageType === "image"
                    ? "Sent an image"
                    : input.content;

                notifyNewMessage(
                    recipientId,
                    ctx.user.name || "Someone",
                    messagePreview,
                    input.conversationId
                ).catch(err => {
                    console.error('[Push] Failed to send new message notification:', err);
                });

                // Auto-update consultation status if artist replies
                if (ctx.user.id === conversation.artistId) {
                    if (input.consultationId) {
                        try {
                            // If explicit ID provided, use it
                            await db.updateConsultation(input.consultationId, { status: "responded" });
                        } catch (err) {
                            console.error("Failed to auto-update provided consultation ID:", err);
                        }
                    } else {
                        // Fallback: find key pending consultations for this client
                        try {
                            const pendingConsultations = await db.getConsultationsForUser(ctx.user.id, "artist");
                            const relevantConsultations = pendingConsultations.filter(
                                c => c.clientId === conversation.clientId && c.status === "pending"
                            );

                            // Update ALL pending consultations for this client to responded
                            for (const consult of relevantConsultations) {
                                await db.updateConsultation(consult.id, { status: "responded" });
                            }
                        } catch (err) {
                            console.error("Failed to auto-update consultation status:", err);
                        }
                    }
                }
            }

            // Send appointment confirmation notification
            if (input.messageType === "appointment_confirmed") {
                const dates = input.content.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\w+ \d+, \d{4})/g);
                const firstDate = dates && dates.length > 0 ? dates[0] : "soon";

                notifyAppointmentConfirmed(
                    recipientId,
                    ctx.user.name || "A client",
                    firstDate,
                    input.conversationId
                ).catch(err => {
                    console.error('[Push] Failed to send appointment confirmation notification:', err);
                });
            }

            return message;
        }),
    updateMetadata: protectedProcedure
        .input(
            z.object({
                messageId: z.number(),
                metadata: z.string(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            // Get the message to verify ownership
            const message = await db.getMessageById(input.messageId);

            if (!message) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Message not found",
                });
            }

            // Verify user is part of the conversation
            const conversation = await db.getConversationById(message.conversationId);

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
                    message: "Not authorized to update this message",
                });
            }

            // Update the message metadata
            await db.updateMessageMetadata(input.messageId, input.metadata);

            return { success: true };
        }),
});
