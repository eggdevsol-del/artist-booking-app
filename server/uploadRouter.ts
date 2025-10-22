import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

export const uploadRouter = router({
  uploadImage: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded image data
        contentType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log('[Upload] Starting image upload:', {
          fileName: input.fileName,
          contentType: input.contentType,
          dataLength: input.fileData.length,
          userId: ctx.user.id
        });
        
        // Decode base64 data
        const base64Data = input.fileData.split(",")[1] || input.fileData;
        const buffer = Buffer.from(base64Data, "base64");
        console.log('[Upload] Buffer created, size:', buffer.length);

        // Generate unique file path
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const extension = input.fileName.split(".").pop() || "jpg";
        const key = `chat-images/${ctx.user.id}/${timestamp}-${randomId}.${extension}`;
        console.log('[Upload] Generated key:', key);

        // Upload to storage
        const result = await storagePut(key, buffer, input.contentType);
        console.log('[Upload] Upload successful:', result);

        return {
          url: result.url,
          key: result.key,
        };
      } catch (error) {
        console.error("[Upload] Image upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to upload image",
        });
      }
    }),
});

