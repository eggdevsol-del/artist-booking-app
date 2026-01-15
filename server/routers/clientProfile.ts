import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { z } from "zod";

export const clientProfileRouter = router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
        const user = await db.getUser(ctx.user.id);
        if (!user) {
            throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        return user;
    }),

    getSpendSummary: protectedProcedure.query(async ({ ctx }) => {
        // Fetch all appointments for client
        const appointments = await db.getAppointmentsForUser(ctx.user.id, "client");

        // Filter for completed/confirmed (assuming these count towards spend)
        // In a real app, we might check for 'completed' status specifically or payment records.
        // For SSOT v1, we'll count 'completed' and 'confirmed'.
        const validAppointments = appointments.filter(a =>
            a.status === 'completed' || a.status === 'confirmed'
        );

        let totalSpend = 0;
        let maxSingleSpend = 0;

        validAppointments.forEach(appt => {
            const price = Number(appt.price || 0);
            totalSpend += price;
            if (price > maxSingleSpend) {
                maxSingleSpend = price;
            }
        });

        return {
            totalSpend,
            maxSingleSpend,
            appointmentCount: validAppointments.length
        };
    }),

    getHistory: protectedProcedure.query(async ({ ctx }) => {
        // Simple history: past appointments
        const appointments = await db.getAppointmentsForUser(ctx.user.id, "client");
        return appointments.map(a => ({
            id: a.id,
            type: 'appointment',
            date: a.startTime,
            title: a.title,
            description: a.serviceName,
            status: a.status
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }),

    getBoards: protectedProcedure.query(async ({ ctx }) => {
        // Mock implementation for Slim v1
        // In a full implementation, this would query a boards table.
        // For now, we return a default "My Moodboard" if the user has sent images.

        // Fetch generic image messages from user to populate a "Auto-Generated" board?
        // Or just return empty for v1 to let UI show empty state.
        // Let's return empty to force "Add Board" UI state, or a placeholder.
        return [
            {
                id: 'default-1',
                title: 'Inspiration',
                previewImages: [],
                itemCount: 0
            }
        ];
    }),

    getPhotos: protectedProcedure.query(async ({ ctx }) => {
        // Fetch all messages sent by user with type 'image'
        // We need a way to scan all conversations. getConversationsForUser -> getMessages
        const conversations = await db.getConversationsForUser(ctx.user.id, "client");

        const allPhotos: { id: number, url: string, createdAt: Date }[] = [];

        // PERF WARNING: N+1 query. For v1 and low volume, acceptable. 
        // Optimize with a dedicated "getMediaForUser" service method later.
        for (const conv of conversations) {
            const msgs = await db.getMessages(conv.id, 50); // check last 50
            msgs.forEach(m => {
                if (m.senderId === ctx.user.id && m.messageType === 'image') {
                    allPhotos.push({
                        id: m.id,
                        url: m.content,
                        createdAt: m.createdAt ? new Date(m.createdAt) : new Date()
                    });
                }
            });
        }

        return allPhotos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    })
});
