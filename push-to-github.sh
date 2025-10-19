#!/bin/bash

# Helper script to push updates to GitHub and trigger Render deployment

echo "🚀 Artist Booking App - Push to GitHub"
echo "======================================"
echo ""

# Check if git remote exists
if ! git remote get-url origin &> /dev/null; then
    echo "❌ No GitHub remote found!"
    echo ""
    echo "Please set your GitHub repository URL first:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/artist-booking-app.git"
    echo ""
    exit 1
fi

# Show current status
echo "📊 Current status:"
git status --short
echo ""

# Ask for commit message
read -p "📝 Enter commit message (or press Enter for default): " commit_msg

if [ -z "$commit_msg" ]; then
    commit_msg="Update app from Manus - $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Add all changes
echo ""
echo "➕ Adding changes..."
git add .

# Commit
echo "💾 Committing: $commit_msg"
git commit -m "$commit_msg"

# Push
echo "⬆️  Pushing to GitHub..."
git push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🔄 Render will automatically detect changes and redeploy your app"
    echo "📱 Check deployment status at: https://dashboard.render.com"
else
    echo ""
    echo "❌ Push failed!"
    echo ""
    echo "If this is your first push, run:"
    echo "  git push -u origin main"
    echo ""
    echo "If authentication failed, make sure you're using a Personal Access Token"
    echo "Create one at: https://github.com/settings/tokens"
fi

