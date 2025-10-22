# Railway Migration Guide

## File Storage Table Migration

The application now requires a `file_storage` table to handle image uploads. This table needs to be created in the Railway database.

### Option 1: Automatic Migration (Recommended)

The table will be automatically created when the first upload occurs, as the `storagePut` function calls `ensureStorageTable()`.

### Option 2: Manual Migration via Railway CLI

If you have Railway CLI installed and configured:

```bash
# Connect to Railway project
railway link

# Run the migration
railway run pnpm db:migrate-storage
```

### Option 3: Manual SQL Execution

Connect to your Railway MySQL database and run:

```sql
CREATE TABLE IF NOT EXISTS file_storage (
  file_key VARCHAR(255) PRIMARY KEY,
  file_data LONGTEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
);
```

### Verification

After deployment, you can verify the table exists by checking the logs when uploading an image. The logs will show:

```
[Storage] Starting upload: { relKey: '...', ... }
[Storage] Storage table ensured
[Storage] Upload successful: { key: '...', url: '...' }
```

## Recent Changes

### Image Upload Fixes
- Fixed `storageGetData` to properly handle Drizzle ORM result format
- Added comprehensive logging throughout upload process
- Improved error handling in both frontend and backend
- File storage now uses MySQL LONGTEXT for base64 encoded images

### VEIL Rebranding
- Updated app title to "VEIL"
- Updated logo references to use veil-logo.png
- Updated manifest.json for PWA
- Updated all user-facing text

## Environment Variables

Make sure these are set in Railway:

```
VITE_APP_TITLE="VEIL"
VITE_APP_LOGO="/veil-logo.png"
DATABASE_URL=<your-railway-mysql-url>
JWT_SECRET=<your-jwt-secret>
```

## Deployment Status

After pushing to GitHub, Railway will automatically:
1. Detect the changes
2. Build the application
3. Deploy to production
4. The file_storage table will be created on first upload

Monitor the deployment at: https://railway.app/project/<your-project-id>

