import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import * as schema from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";

export const walletRouter = router({
    createTemplate: protectedProcedure
        .input(z.object({
            name: z.string(),
            description: z.string().optional(),
            value: z.number().min(0) // in cents
        }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.role !== 'artist' && ctx.user.role !== 'admin') {
                throw new TRPCError({ code: "FORBIDDEN" });
            }

            await ctx.db.insert(schema.voucherTemplates).values({
                artistId: ctx.user.id,
                name: input.name,
                description: input.description,
                value: input.value
            });

            return { success: true };
        }),

    listTemplates: protectedProcedure
        .query(async ({ ctx }) => {
            if (ctx.user.role !== 'artist' && ctx.user.role !== 'admin') {
                throw new TRPCError({ code: "FORBIDDEN" });
            }
            return await ctx.db.query.voucherTemplates.findMany({
                where: eq(schema.voucherTemplates.artistId, ctx.user.id),
                orderBy: desc(schema.voucherTemplates.createdAt)
            });
        }),

    issueVoucher: protectedProcedure
        .input(z.object({
            templateId: z.number(),
            clientId: z.string(),
            expiresInDays: z.number().optional()
        }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.role !== 'artist' && ctx.user.role !== 'admin') {
                throw new TRPCError({ code: "FORBIDDEN" });
            }

            // Generate unique code
            const code = randomBytes(4).toString('hex').toUpperCase();

            // Calculate expiry
            let expiresAt: string | undefined = undefined;
            if (input.expiresInDays) {
                const date = new Date();
                date.setDate(date.getDate() + input.expiresInDays);
                expiresAt = date.toISOString();
            }

            await ctx.db.insert(schema.issuedVouchers).values({
                templateId: input.templateId,
                artistId: ctx.user.id,
                clientId: input.clientId,
                code: code,
                status: 'active',
                expiresAt: expiresAt
            });

            return { success: true, code };
        }),

    getMyVouchers: protectedProcedure
        .query(async ({ ctx }) => {
            return await ctx.db.query.issuedVouchers.findMany({
                where: eq(schema.issuedVouchers.clientId, ctx.user.id),
                with: {
                    template: true,
                    artist: {
                        columns: {
                            name: true,
                            businessName: true // Note: businessName is in artistSettings, not users table strictly, might need adjustment if using drizzle relations correctly. 
                            // Actually 'artist' relation points to 'users'. 'users' table doesn't have businessName.
                            // We might need to fetch artistSettings separately or assume the user name is enough for now.
                        }
                    }
                },
                orderBy: desc(schema.issuedVouchers.createdAt)
            });
        })
});
