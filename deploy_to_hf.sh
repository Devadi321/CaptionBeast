#!/bin/bash

# Configuration based on your screenshot
HF_USERNAME="adithyan321"
SPACE_NAME="caption-beast-backend"
SPACE_URL="https://huggingface.co/spaces/$HF_USERNAME/$SPACE_NAME"

echo "=============================================="
echo "   CaptionBeast -> Hugging Face Deployer      "
echo "=============================================="
echo ""
echo "I will push your code to: $SPACE_URL"
echo ""
echo "Step 1: I need your Hugging Face Access Token."
echo "   (Get it here: https://huggingface.co/settings/tokens)"
echo "   (Make sure it has 'write' permissions)"
echo ""
read -p "Paste your User Access Token: " HF_TOKEN

if [ -z "$HF_TOKEN" ]; then
    echo "Error: Token cannot be empty."
    exit 1
fi

echo ""
echo "Step 2: Configuring Remote..."
# Remove existing remote if it exists to avoid errors
git remote remove space 2>/dev/null

# Add the authenticated remote URL
git remote add space "https://$HF_USERNAME:$HF_TOKEN@huggingface.co/spaces/$HF_USERNAME/$SPACE_NAME"

echo "Step 3: Pushing code..."
echo "This might take a few seconds..."
git push space main --force

echo ""
echo "=============================================="
echo "   SUCCESS! 🚀                                "
echo "=============================================="
echo "Go to your dashboard to see it building:"
echo "$SPACE_URL"
