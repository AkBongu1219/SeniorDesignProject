#!/bin/bash

# Domus Smart Home Frontend (React Native) Setup Script

set -e  # Exit immediately if a command exits with a non-zero status

echo "--------------------------------------------------"
echo "Domus Smart Home Frontend Setup Script"
echo "--------------------------------------------------"

# Check Node.js installation
if ! command -v node &> /dev/null
then
    echo "Error: Node.js is not installed. Please install Node.js (version 18 or higher) and rerun this script."
    exit 1
fi

# Check npm installation
if ! command -v npm &> /dev/null
then
    echo "Error: npm is not installed. Please install npm and rerun this script."
    exit 1
fi

# Optional: Check for Expo CLI (if you're using Expo)
if ! command -v expo &> /dev/null
then
    echo "Expo CLI not detected. Installing globally..."
    npm install -g expo-cli
fi

# Install JavaScript dependencies from package.json
echo "Installing JavaScript dependencies with npm..."
npm install

# Install iOS Pods (if macOS and ios folder exists)
if [[ "$OSTYPE" == "darwin"* && -d "ios" ]]; then
    echo "Detected macOS system. Installing CocoaPods dependencies..."
    cd ios
    pod install
    cd ..
fi

echo "--------------------------------------------------"
echo "✅ Frontend setup complete!"
echo "To start the development server, run: npm start or npx react-native start"
echo "--------------------------------------------------"

# --------------------------------------------------
# LLM Backend Setup (Node.js)
# --------------------------------------------------

echo "Setting up the LLM backend (LLM/server.js)..."

# Navigate to the LLM folder
cd LLM

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "Installing Node.js dependencies for LLM backend..."
    npm install
else
    echo "Warning: package.json not found in LLM folder. Please ensure it exists."
fi

# Generate .env.example for LLM if it doesn't exist
if [ ! -f ".env.example" ]; then
    echo "Creating .env.example for LLM..."
    cat <<EOL > .env.example
OPENAI_API_KEY=your_openai_key_here
EOL
    echo ".env.example created. Please copy to .env and fill your OpenAI API key."
fi

# Return to the Backend root folder
cd ..

echo "✅ LLM backend setup complete!"

# --------------------------------------------------
# LLM Backend Setup (Node.js)
# --------------------------------------------------

echo "Setting up the LLM backend (LLM/server.js)..."

# Navigate to the LLM folder
cd LLM

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "Installing Node.js dependencies for LLM backend..."
    npm install
else
    echo "Warning: package.json not found in LLM folder. Please ensure it exists."
fi

# Generate .env.example for LLM if it doesn't exist
if [ ! -f ".env.example" ]; then
    echo "Creating .env.example for LLM..."
    cat <<EOL > .env.example
OPENAI_API_KEY=your_openai_key_here
EOL
    echo ".env.example created. Please copy to .env and fill your OpenAI API key."
fi

# Return to the Backend root folder
cd ..

echo "✅ LLM backend setup complete!"