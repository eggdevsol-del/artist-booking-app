import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { MediaService } from "../services/media.service";

export const uploadRouter = router({
    uploadImage: publicProcedure
        .input(z.object({
            fileData: z.string(), // Base64 string
            fileName: z.string(),
            contentType: z.string(),
        }))
        .mutation(async ({ input }) => {
            // Validate type
            if (!MediaService.isValidType(input.contentType)) {
                throw new Error("Invalid file type. Only images and videos are allowed.");
            }

            // Save file
            const url = await MediaService.saveBase64(input.fileData, input.fileName);

            return {
                url,
                success: true
            };
        }),
});
