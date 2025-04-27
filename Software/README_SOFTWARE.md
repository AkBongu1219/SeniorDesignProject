## ✅ Option 1: Easiest Setup (Prebuilt Domus System - Recommended for General Users)

If you have purchased the pre-configured **Domus Smart Home system with Domus-enabled sensors**:

- All hardware components (sensor nodes, vision module, central hub) come **pre-flashed and pre-configured**.
- The backend server and detection models are **already set up on the central Raspberry Pi 5 hub**.
- You do **NOT** need to manually clone the repository or run any backend setup scripts.

---

### 🟢 **Steps to Get Started:**

1. **Clone the Repository Frontend Application:**
   ```bash
   git clone https://github.com/your-repo/domus-smart-home.git
   cd SeniorDesignProject/Software/Frontend/Domus_Application/
   ```

2. **Run the Frontend Setup Script:**
   ```bash
   bash setup_frontend.sh
   ```

   This will:
   - Check for Node.js and npm.
   - Install JavaScript dependencies via `npm install`.
   - Install React Native CLI (if not present).
   - For macOS users: Run `pod install` for iOS dependencies (if using native iOS build).

3. **Open the App in Xcode for iOS Deployment:**
   - Open the `ios/` project folder in Xcode.
   - Connect your iPhone or use the simulator.
   - Build and run the app directly from Xcode.

4. **Pair Your Devices Through the App:**
   - Power on your Domus hub and sensors.
   - Ensure your mobile device is on the same Wi-Fi network.
   - Use the “Devices” screen within the app to discover and pair available Domus sensors.
   - Configure alerts, energy monitoring, and assistant queries directly through the app.

> ⚠️ **Note:** The backend system is already set up on your purchased Domus hardware. You do not need to run backend setup scripts if you are using the pre-configured system.

---

## 🛠️ Option 2: Developer / Manual Setup via GitHub Repository

If you are a developer or builder who wants to manually set up the Domus Smart Home system from source, use the provided backend and frontend setup scripts.

The following instructions explain how to install dependencies, configure the environment, flash sensor nodes, and prepare detection models.

### ✅ Backend Setup Instructions

#### Step 1: Navigate to the Backend Folder
After cloning the repository:
```bash
cd SeniorDesignProject/Software/Backend/
```

#### Step 2: Run the Backend Setup Script
```bash
bash setup.sh
```

The setup script will:
- Check for Python 3.x.
- Create a Python virtual environment (`venv/`).
- Install all dependencies from `requirements.txt`.
- Generate the required folder structure (`logs/`, `db/`, `models/`).
- Run the database setup script (`setup_database.py`).
- Create two helper scripts:
  - `flash_sensors.sh`: For flashing ESP32 sensor nodes.
  - `download_models.sh`: For downloading detection models (currently a placeholder — see below).
- Install Node.js dependencies for the LLM backend (located in `LLM/server.js`).

#### Step 3: Configure Environment Variables
⚠️ **Important:**  
You must configure environment variables for **both the backend and the LLM service**.

1. Backend root:
   ```bash
   cp .env.example .env
   ```
   Fill in:
   ```bash
   OPENAI_API_KEY=your_openai_key_here
   SMART_PLUG_IP=192.168.1.100
   CAMERA_STREAM_IP=192.168.1.200
   ```

2. LLM backend (inside `LLM/` folder):
   ```bash
   cd LLM/
   cp .env.example .env
   ```
   Fill in:
   ```bash
   OPENAI_API_KEY=your_openai_key_here
   ```

> ✅ Both `.env` files must be properly configured for the system to work.

#### Step 4: Add Detection Models
A placeholder script `download_models.sh` is provided inside the `Backend` folder:
```bash
./download_models.sh
```

You must **edit this script** and add the appropriate `wget` or `curl` commands to download your detection models (e.g., `.tflite` files or face recognition encodings). Example:
```bash
wget https://your_model_link.com/model.tflite -O models/model.tflite
```

If you already have the models, you can simply place them manually into the:
```
SeniorDesignProject/Software/Backend/models/
```
folder.

#### Step 5: Flash the ESP32 Sensor Nodes
The setup script also generates `flash_sensors.sh`, which provides flashing commands using `arduino-cli`.

Make sure:
1. You have Arduino CLI installed.
2. Your ESP32 sensor node code (`motion_sensor_ESP32.ino` and `BME688_ESP32.ino`) is located inside:
   ```
   SeniorDesignProject/Software/Backend/ESP32_Code/
   ```

To flash your sensors:
```bash
./flash_sensors.sh
```

> ⚠️ Check that the correct USB port (`/dev/ttyUSB0`) and board name (`esp32:esp32:esp32wrooomda`) are specified in `flash_sensors.sh`.  
> Use `arduino-cli board list` to verify your board and port.

#### Step 6: Activate Your Environment Before Running
Every time you work on the backend, activate your Python environment:
```bash
source venv/bin/activate
```

#### (Optional) Manually Start the LLM Backend
To manually start the LLM backend (if needed for testing or development):
```bash
cd SeniorDesignProject/Software/Backend/LLM
npm start
```
The LLM server listens on port `5051` (configured in `server.js`).

---

### ✅ Frontend Setup Instructions (React Native App)

#### Step 1: Navigate to the Frontend Folder
```bash
cd SeniorDesignProject/Software/Frontend/Domus_Application/
```

#### Step 2: Run the Frontend Setup Script
```bash
bash setup_frontend.sh
```

The frontend setup script will:
- Check for Node.js (version 18 or higher).
- Install JavaScript dependencies from `package.json` using `npm install`.
- Install Expo CLI globally if not already present.
- For macOS users with the iOS folder: automatically run `pod install` to handle CocoaPods dependencies.

#### Step 3: Configure Environment Variables (If Applicable)
If your frontend app uses environment variables, ensure that a `.env` file is created (use `.env.example` if provided).

> ⚠️ **Reminder:** Fill out any required API keys or configuration values in your `.env` file for successful app operation.

#### Step 4: Start the React Native Development Server
```bash
npm start
```
or
```bash
npx react-native start
```

For running on physical devices:
- Use **Expo Go** for quick testing (if using Expo).
- Or build directly via **Xcode (iOS)** or **Android Studio (Android)** if using native builds.

---

---

## ⚙️ Development Environment and Tool Versions

The following tools and versions were used for building and testing the Domus Smart Home system:

### Backend (Python)
- Python: 3.11.x
- Flask: 2.3.2
- Flask-SocketIO: 5.3.4
- Python-SocketIO: 5.9.0
- OpenCV: 4.8.1.78
- dlib: 19.24.2
- face_recognition: 1.3.0
- numpy: 1.24.4
- requests: 2.31.0
- Arduino CLI: 0.34.3 (for ESP32 sensor flashing)

### LLM Backend (Node.js)
- Node.js: 18.x LTS
- npm: 9.x
- express: ^4.18.2
- axios: ^1.5.0
- openai: ^4.0.0
- socket.io: ^4.7.2

### Frontend (React Native)
- React Native CLI: 0.73.x
- Node.js: 18.x LTS
- npm: 9.x
- react-native-vision-camera: as per package.json
- react-native-permissions: as per package.json
- CocoaPods: 1.12.x (for iOS dependency management)

---

> ✅ Note: Users can either purchase the pre-built Domus system (Option 1) or use the provided setup scripts (Option 2). Manual individual module build instructions are not required, as the setup scripts fully handle installation and configuration.

---


---

## 🗺️ Software Module Flow Diagram

The diagram below illustrates the interaction between different software modules within the Domus Smart Home system:

```mermaid
graph TD
    A[Domus Mobile App (React Native)] -->|REST / WebSocket| B[Backend Server (Flask + SQLite)]
    B --> C[MotionSensor (ESP32)]
    B --> D[EnvironSensor (ESP32 + BME688)]
    B --> E[Vision Module (Object Detection + Face Recognition)]
    B --> F[Smart Power Plug (TP-Link KP115)]
    B --> G[LLM Backend (Node.js + OpenAI)]
    G --> B
```

> ⚠️ **Note:** If the diagram does not render correctly on your platform, you may view the diagram in the project's Wiki or diagram assets folder if provided.

---

## 📱 Domus Smart Home App Screenshots

### Device Pairing and Home Dashboard

| Device Pairing                       | Home Dashboard                        |
|----------------------------------------|----------------------------------------|
| ![Pairing Screen](./Frontend/Documentation/App_Screenshots/pairing_screen.png) | ![Home Screen](./Frontend/Documentation/App_Screenshots/home_screen.png) |

### Energy Graphs and Domus Assistant Query

| Energy Graphs                         | Domus Assistant Query                 |
|----------------------------------------|----------------------------------------|
| ![Energy Graphs](./Frontend/Documentation/App_Screenshots/energy_graphs.png) | ![Assistant Chat](./Frontend/Documentation/App_Screenshots/assistant_chat.png) |