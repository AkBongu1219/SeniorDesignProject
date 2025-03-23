from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import asyncio
from datetime import datetime
import csv
import os
import logging
from kasa import Discover
from apscheduler.schedulers.background import BackgroundScheduler

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Smart Plug IP
PLUG_IP = "192.168.1.155"
CSV_FILE = "energy_data.csv"

# Function to initialize CSV
def initialize_csv():
    """Create CSV file with headers if it doesn't exist."""
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, mode="w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(["timestamp", "current_power_watts", "total_energy_kwh", "daily_energy_kwh"])

# Function to log energy data
def log_energy_data(current_power, total_energy, daily_energy):
    """Append energy readings to the CSV file."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Read last recorded row to avoid duplicates
    last_entry = None
    if os.path.exists(CSV_FILE):
        with open(CSV_FILE, mode="r", newline="") as file:
            rows = list(csv.reader(file))
            if len(rows) > 1:
                last_entry = rows[-1]

    # Check if new data differs from last entry
    new_entry = [timestamp, str(current_power), str(total_energy), str(daily_energy)]
    if last_entry is None or new_entry[1:] != last_entry[1:]:
        with open(CSV_FILE, mode="a", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(new_entry)
        logging.info(f"Logged energy at {timestamp}")

# Async function to get Smart Plug data
async def get_real_energy_data():
    """Fetch real-time energy readings from the Smart Plug with retries."""
    retries = 3
    delay = 5
    
    for attempt in range(retries):
        try:
            plug = await Discover.discover_single(PLUG_IP)
            await plug.update()
            emeter_data = await plug.get_emeter_realtime()
            return {
                "current_power": emeter_data.get("power_mw", 0) / 1000,  # Convert mW to W
                "total_energy": emeter_data.get("total_wh", 0) / 1000,  # Convert Wh to kWh
                "daily_energy": emeter_data.get("voltage_mv", 0) / 1000  # Placeholder
            }
        except Exception as e:
            logging.warning(f"Attempt {attempt + 1}/{retries}: Failed to fetch energy data. Error: {e}")
            await asyncio.sleep(delay)
    
    logging.error("All retries failed. Returning default values.")
    return {"current_power": 0, "total_energy": 0, "daily_energy": 0}

# Function to log energy every 30 seconds
def auto_log_energy():
    """Automatically log real-time energy readings every 30 seconds."""
    async def fetch_data():
        return await get_real_energy_data()

    try:
        real_data = asyncio.run(fetch_data())
        log_energy_data(real_data["current_power"], real_data["total_energy"], real_data["daily_energy"])
    except Exception as e:
        logging.error(f"Error fetching energy data: {e}")

# Start Background Scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(auto_log_energy, "interval", seconds=30, coalesce=True, max_instances=1)
scheduler.start()

# Flask API Routes
@app.before_request
def log_request_info():
    logging.info(f"Request: {request.method} {request.url}")

@app.route("/", methods=["GET"])
def home():
    """Welcome message for the API."""
    return jsonify({"message": "Welcome to the Smart Plug Backend"}), 200

@app.route("/favicon.ico")
def favicon():
    return "", 204

@app.route("/energy", methods=["GET"])
def energy_readings():
    """Retrieve the latest logged energy data."""
    if not os.path.exists(CSV_FILE):
        return jsonify({"error": "No data available"}), 404

    with open(CSV_FILE, mode="r", newline="") as file:
        reader = list(csv.reader(file))
        if len(reader) <= 1:
            return jsonify({"error": "No data recorded yet"}), 404

        last_entry = reader[-1]
        return jsonify({
            "timestamp": last_entry[0],
            "current_power": float(last_entry[1]),  # Convert to number
            "total_energy": float(last_entry[2]),  # Convert to number
            "daily_energy": float(last_entry[3])   # Convert to number
        }), 200

@app.route("/download_csv", methods=["GET"])
def download_csv():
    """Allow users to download the full energy data CSV file."""
    if not os.path.exists(CSV_FILE):
        return jsonify({"error": "No data available"}), 404

    return send_file(CSV_FILE, as_attachment=True)

@app.route("/status", methods=["GET"])
def get_plug_status():
    try:
        async def fetch_plug_status():
            plug = await Discover.discover_single(PLUG_IP)
            await plug.update()
            return plug.is_on
        
        is_on = asyncio.run(fetch_plug_status())
        return jsonify({"plug_state": is_on}), 200
    except Exception as e:
        logging.error(f"Failed to fetch plug status: {e}")
        return jsonify({"error": "Failed to get plug status"}), 500
    
@app.route("/toggle", methods=["POST"])
def toggle_plug():
    """Toggle the smart plug's state."""
    try:
        data = request.json
        action = data.get("action")  # Expecting 'on' or 'off'

        if action not in ["on", "off"]:
            return jsonify({"error": "Invalid action. Use 'on' or 'off'"}), 400

        async def toggle_action():
            plug = await Discover.discover_single(PLUG_IP)
            await plug.update()

            if action == "on":
                await plug.turn_on()
            else:
                await plug.turn_off()

            await plug.update()
            return plug.is_on

        is_on = asyncio.run(toggle_action())

        return jsonify({"plug_state": is_on}), 200
    except Exception as e:
        logging.error(f"Failed to toggle plug state: {e}")
        return jsonify({"error": "Failed to toggle plug"}), 500

# Initialize CSV file
initialize_csv()

# Run Flask app
if __name__ == "__main__":
    app.run(host="192.168.1.163", port=8080, debug=True)
