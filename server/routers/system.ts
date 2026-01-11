import { TRPCError } from "@trpc/server";
import { systemRouter as coreSystemRouter } from "../_core/systemRouter";
import { artistProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const systemRouter = router({
    ...coreSystemRouter._def.procedures,
    loadDemoData: artistProcedure.mutation(async ({ ctx }) => {
        // Create test client
        const testClientId = "demo-client-" + Date.now();
        await db.upsertUser({
            id: testClientId,
            name: "Sarah Johnson",
            email: "sarah.demo@example.com",
            phone: "+1 (555) 234-5678",
            role: "client",
            loginMethod: "demo",
            bio: "Birthday: 1995-06-15",
        });

        // Create conversation
        const conversation = await db.createConversation({
            artistId: ctx.user.id,
            clientId: testClientId,
        });

        if (!conversation) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create conversation",
            });
        }

        // Create messages
        await db.createMessage({
            conversationId: conversation.id,
            senderId: testClientId,
            content: "Hi! I'd like to book an appointment for a custom tattoo design.",
        });
        await db.createMessage({
            conversationId: conversation.id,
            senderId: ctx.user.id,
            content: "Hello Sarah! I'd love to help with your custom design. What did you have in mind?",
        });
        await db.createMessage({
            conversationId: conversation.id,
            senderId: testClientId,
            content: "I'm thinking of a floral sleeve design with some geometric elements. Do you have any availability next week?",
        });
        await db.createMessage({
            conversationId: conversation.id,
            senderId: ctx.user.id,
            content: "That sounds beautiful! Let me check my calendar and get back to you with some available times.",
        });
        await db.createMessage({
            conversationId: conversation.id,
            senderId: testClientId,
            content: "Perfect, thank you! Looking forward to our appointment!",
        });

        // Create appointment
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(14, 0, 0, 0);
        const endTime = new Date(nextWeek);
        endTime.setHours(16, 0, 0, 0);

        await db.createAppointment({
            conversationId: conversation.id,
            artistId: ctx.user.id,
            clientId: testClientId,
            title: "Custom Floral Sleeve Tattoo - Consultation",
            description: "Initial consultation and design discussion for custom floral sleeve with geometric elements",
            startTime: nextWeek,
            endTime: endTime,
            serviceName: "Custom Tattoo Design",
            price: 150,
            depositAmount: 50,
            depositPaid: true,
            confirmationSent: false,
            reminderSent: false,
            followUpSent: false
        });

        return { success: true, clientId: testClientId };
    }),
});
