#!/bin/bash
# Navigate to the directory containing this script
cd "$(dirname "$0")"

# Print a welcome message
echo "============================================"
echo "   🦁 CaptionBeast Launcher"
echo "============================================"

# Check if the start script exists
if [ -f "./local_version/START_LOCAL.sh" ]; then
    # Make sure it's executable
    chmod +x ./local_version/START_LOCAL.sh
    
    # Run it
    ./local_version/START_LOCAL.sh
else
    echo "❌ Error: Could not find local_version/START_LOCAL.sh"
    echo "Please make sure you are in the correct folder."
fi

# Keep window open if it crashes immediately
read -p "Press [Enter] to close this window..."
