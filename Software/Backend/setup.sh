#!/bin/bash

# Domus Smart Home Setup Script
# This script sets up the backend environment, installs dependencies,
# prepares folder structure, runs database setup, and generates helper scripts.

set -e  # Exit on any error

PYTHON_VERSION=python3
VENV_DIR="venv"
REQUIREMENTS_FILE="requirements.txt"

echo "--------------------------------------------------"
echo "Domus Smart Home Backend Setup Script"
echo "--------------------------------------------------"

# Check for Python
if ! command -v $PYTHON_VERSION &> /dev/null
then
    echo "Error: Python 3 is not installed. Please install it and rerun this script."
    exit 1
fi

# Create virtual environment
echo "Creating virtual environment..."
$PYTHON_VERSION -m venv $VENV_DIR
echo "Virtual environment created at $VENV_DIR."

# Activate virtual environment and install dependencies
source $VENV_DIR/bin/activate
echo "Installing Python dependencies from $REQUIREMENTS_FILE..."
pip install --upgrade pip
pip install -r $REQUIREMENTS_FILE

# Prepare folder structure
echo "Creating required folders (if not already present)..."
mkdir -p logs
mkdir -p db
mkdir -p models

# Generate .env.example file
echo "Generating .env.example file..."
cat <<EOL > .env.example
OPENAI_API_KEY=your_openai_key_here
SMART_PLUG_IP=192.168.1.100
CAMERA_STREAM_IP=192.168.1.200
EOL
echo ".env.example created. Please copy it to .env and fill your values."

# Run database setup script
echo "Running database setup..."
python setup_database.py
echo "Database setup complete."

# Generate flash_sensors.sh
echo "Creating ESP32 flashing script..."
cat <<EOL > flash_sensors.sh
#!/bin/bash

# ESP32 Flashing Script (Arduino CLI)
# Adjust these paths and port as needed
ARDUINO_CLI="arduino-cli"
BOARD="esp32:esp32:esp32wrooomda"
PORT="/dev/ttyUSB0"

# Compile and upload the motion sensor code
\$ARDUINO_CLI compile --fqbn \$BOARD ESP32_Code/motion_sensor_ESP32.ino
\$ARDUINO_CLI upload -p \$PORT --fqbn \$BOARD ESP32_Code/motion_sensor_ESP32.ino

# Compile and upload the BME688 environment sensor code
\$ARDUINO_CLI compile --fqbn \$BOARD ESP32_Code/BME688_ESP32.ino
\$ARDUINO_CLI upload -p \$PORT --fqbn \$BOARD ESP32_Code/BME688_ESP32.ino
EOL
chmod +x flash_sensors.sh

# Generate download_models.sh placeholder
echo "Creating detection model download script placeholder..."
cat <<EOL > download_models.sh
#!/bin/bash

# Download your detection models here
# Example:
# wget https://your_model_link.com/model.tflite -O models/model.tflite

echo "Model download script not yet implemented. Please add your model links."
EOL
chmod +x download_models.sh


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
    echo ".env.example created in LLM folder. Please copy to .env and fill your OpenAI API key."
fi

# Return to the Backend root folder
cd ..

echo "✅ LLM backend setup complete!"

echo "--------------------------------------------------"
echo "✅ Setup complete."
echo "Activate your environment: source $VENV_DIR/bin/activate"
echo "Check flash_sensors.sh and download_models.sh for further setup."
echo "--------------------------------------------------"