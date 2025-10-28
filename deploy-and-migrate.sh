#!/bin/bash
# Deployment script that runs migration before starting the app

echo "🔄 Running database migration..."
node create-client-notes-table-now.js

if [ $? -eq 0 ]; then
  echo "✅ Migration completed successfully"
  echo "🚀 Starting application..."
  pnpm start
else
  echo "❌ Migration failed, but starting app anyway..."
  pnpm start
fi

