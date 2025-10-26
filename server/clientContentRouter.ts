import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { storagePut } from "./storage";

// Custom procedure for artist-only operations
const artistProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "artist" && ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Artist access required",
    });
  }
  return next({ ctx });
});

export const clientContentRouter = router({
  // Get all content for a client (accessible by both artist and client)
  listContent: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify access: artist can see their uploads, client can see their own content
      if (ctx.user.role === "client" && ctx.user.id !== input.clientId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this content",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const result: any = await db.execute(sql`
        SELECT * FROM client_content 
        WHERE client_id = ${input.clientId}
        ORDER BY created_at DESC
      `);

      return result[0] || [];
    }),

  // Upload content for a client (artist only)
  uploadContent: artistProcedure
    .input(
      z.object({
        clientId: z.string(),
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded
        contentType: z.string(),
        fileType: z.enum(["image", "video"]),
        title: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("[ClientContent] Starting upload:", {
        clientId: input.clientId,
        fileName: input.fileName,
        fileType: input.fileType,
      });

      // Decode base64 data
      const base64Data = input.fileData.split(",")[1] || input.fileData;
      const buffer = Buffer.from(base64Data, "base64");
      const fileSize = buffer.length;

      // Generate unique file path
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const extension = input.fileName.split(".").pop() || "jpg";
      const key = `client-content/${input.clientId}/${timestamp}-${randomId}.${extension}`;

      // Upload to storage
      const result = await storagePut(key, buffer, input.contentType);

      // Save to database
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Use raw mysql2 for insert to avoid Drizzle sql template issues
      const mysql = await import('mysql2/promise');
      const connection = await mysql.createConnection(process.env.DATABASE_URL!);
      
      try {
        await connection.execute(
          'INSERT INTO client_content (client_id, artist_id, file_key, file_name, file_type, mime_type, file_size, title, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            input.clientId,
            ctx.user.id,
            result.key,
            input.fileName,
            input.fileType,
            input.contentType,
            fileSize,
            input.title || null,
            input.description || null
          ]
        );
      } finally {
        await connection.end();
      }

      console.log("[ClientContent] Upload successful");

      return {
        success: true,
        url: result.url,
        key: result.key,
      };
    }),

  // Delete content (artist only)
  deleteContent: artistProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Verify ownership
      const result: any = await db.execute(sql`
        SELECT artist_id FROM client_content WHERE id = ${input}
      `);

      const rows = result[0];
      if (!rows || rows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content not found",
        });
      }

      if (rows[0].artist_id !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this content",
        });
      }

      // Delete from database using raw mysql2
      const mysql = await import('mysql2/promise');
      const connection = await mysql.createConnection(process.env.DATABASE_URL!);
      
      try {
        await connection.execute(
          'DELETE FROM client_content WHERE id = ?',
          [input]
        );
      } finally {
        await connection.end();
      }

      return { success: true };
    }),

  // Get client notes (artist only)
  getNotes: artistProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const result: any = await db.execute(sql`
        SELECT * FROM client_notes 
        WHERE client_id = ${input.clientId} AND artist_id = ${ctx.user.id}
        ORDER BY created_at DESC
      `);

      return result[0] || [];
    }),

  // Add or update note (artist only)
  saveNote: artistProcedure
    .input(
      z.object({
        id: z.number().optional(),
        clientId: z.string(),
        note: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Use raw mysql2 for insert/update to avoid Drizzle sql template issues
      const mysql = await import('mysql2/promise');
      const connection = await mysql.createConnection(process.env.DATABASE_URL!);
      
      try {
        if (input.id) {
          // Update existing note
          await connection.execute(
            'UPDATE client_notes SET note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND artist_id = ?',
            [input.note, input.id, ctx.user.id]
          );
        } else {
          // Create new note
          await connection.execute(
            'INSERT INTO client_notes (client_id, artist_id, note) VALUES (?, ?, ?)',
            [input.clientId, ctx.user.id, input.note]
          );
        }
      } finally {
        await connection.end();
      }

      return { success: true };
    }),

  // Delete note (artist only)
  deleteNote: artistProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Use raw mysql2 for delete to avoid Drizzle sql template issues
      const mysql = await import('mysql2/promise');
      const connection = await mysql.createConnection(process.env.DATABASE_URL!);
      
      try {
        await connection.execute(
          'DELETE FROM client_notes WHERE id = ? AND artist_id = ?',
          [input, ctx.user.id]
        );
      } finally {
        await connection.end();
      }

      return { success: true };
    }),

  // Delete client profile (artist only)
  deleteClient: artistProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Verify the client exists and has a conversation with this artist
      const convResult: any = await db.execute(sql`
        SELECT id FROM conversations 
        WHERE artist_id = ${ctx.user.id} AND client_id = ${input}
      `);

      if (!convResult[0] || convResult[0].length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this client",
        });
      }

      // Delete user (cascade will handle related records) using raw mysql2
      const mysql = await import('mysql2/promise');
      const connection = await mysql.createConnection(process.env.DATABASE_URL!);
      
      try {
        await connection.execute(
          'DELETE FROM users WHERE id = ?',
          [input]
        );
      } finally {
        await connection.end();
      }

      return { success: true };
    }),
});

