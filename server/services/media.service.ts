import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'server', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class MediaService {
    /**
     * Save a base64 string as a file
     * @param base64Data content of the file
     * @param filename original filename
     * @returns public URL path
     */
    static async saveBase64(base64Data: string, filename: string): Promise<string> {
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 string');
        }

        const buffer = Buffer.from(matches[2], 'base64');
        const extension = path.extname(filename);
        const uniqueName = `${randomUUID()}${extension}`;
        const filePath = path.join(UPLOAD_DIR, uniqueName);

        await fs.promises.writeFile(filePath, buffer);

        return `/uploads/${uniqueName}`;
    }

    /**
     * Validate file type (image or video)
     */
    static isValidType(mimeType: string): boolean {
        return mimeType.startsWith('image/') || mimeType.startsWith('video/');
    }
}
