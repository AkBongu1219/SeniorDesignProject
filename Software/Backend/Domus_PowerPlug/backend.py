from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import asyncio
from datetime import datetime, timedelta
import csv
import os
import logging
from kasa import Discover
from apscheduler.schedulers.background import BackgroundScheduler
import pandas as pd
import numpy as np

# Setup logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Smart Plug IP and CSV file paths
PLUG_IP = "192.168.1.152"
ENERGY_CSV_FILE = "energy_data.csv"  # Main data file
HOURLY_ENERGY_CSV = "hourly_energy_data.csv"  # Hourly energy data (0-23)
DAILY_ENERGY_CSV = "daily_energy_data.csv"  # Weekly energy data (Mon-Sun)
POWER_CSV_FILE = "power_data.csv"  # Recent power readings for graph

# Global variables for tracking
today_total_energy = 0
daily_start_value = 0
last_reset_day = datetime.now().day
today_hourly_energy = [0] * 24  # Energy consumed each hour of today
weekly_energy = [0] * 7  # Energy consumed each day of the week
recent_power_readings = []  # List to store recent power readings (timestamp, value)

# Function to initialize CSV files
def initialize_csv_files():
    # Main energy data CSV
    if not os.path.exists(ENERGY_CSV_FILE):
        with open(ENERGY_CSV_FILE, mode="w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow([
                "timestamp", 
                "current_power_watts", 
                "total_energy_kwh", 
                "daily_energy_kwh", 
                "running_energy_sum"
            ])
    
    # Hourly energy data CSV
    if not os.path.exists(HOURLY_ENERGY_CSV):
        with open(HOURLY_ENERGY_CSV, mode="w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(["hour", "energy_kwh"])
            for hour in range(24):
                writer.writerow([hour, 0])
    
    # Daily energy data CSV
    if not os.path.exists(DAILY_ENERGY_CSV):
        with open(DAILY_ENERGY_CSV, mode="w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(["day", "energy_kwh"])
            days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            for i, day in enumerate(days):
                writer.writerow([day, 0])
    
    # Power data CSV
    if not os.path.exists(POWER_CSV_FILE):
        with open(POWER_CSV_FILE, mode="w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(["timestamp", "power_watts"])

# Function to log energy data to main CSV
def log_energy_data(current_power, total_energy, daily_energy, running_sum):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(ENERGY_CSV_FILE, mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow([timestamp, str(current_power), str(total_energy), str(daily_energy), str(running_sum)])
    
    logging.info(f"Logged energy at {timestamp}")

# Function to update hourly energy data
def update_hourly_energy_data():
    now = datetime.now()
    current_hour = now.hour
    
    # Read existing data
    data = []
    if os.path.exists(HOURLY_ENERGY_CSV):
        with open(HOURLY_ENERGY_CSV, mode="r", newline="") as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            data = [[int(row[0]), float(row[1])] for row in reader]
    else:
        # Initialize with zeros if file doesn't exist
        data = [[hour, 0] for hour in range(24)]
    
    # Update the current hour with the latest value
    for row in data:
        if row[0] == current_hour:
            row[1] = today_hourly_energy[current_hour]
            break
    
    # Write updated data
    with open(HOURLY_ENERGY_CSV, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["hour", "energy_kwh"])
        for row in sorted(data, key=lambda x: x[0]):
            writer.writerow(row)

# Function to update daily energy data
def update_daily_energy_data():
    now = datetime.now()
    current_day_idx = now.weekday()  # 0 = Monday, 6 = Sunday
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    # Read existing data
    data = []
    if os.path.exists(DAILY_ENERGY_CSV):
        with open(DAILY_ENERGY_CSV, mode="r", newline="") as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            data = [[row[0], float(row[1])] for row in reader]
    else:
        # Initialize with zeros if file doesn't exist
        data = [[day, 0] for day in days]
    
    # Update the current day with the latest value
    for row in data:
        if row[0] == days[current_day_idx]:
            row[1] = weekly_energy[current_day_idx]
            break
    
    # Write updated data
    with open(DAILY_ENERGY_CSV, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["day", "energy_kwh"])
        # Ensure days are in correct order
        day_dict = {row[0]: row[1] for row in data}
        for day in days:
            writer.writerow([day, day_dict.get(day, 0)])

# Function to update power data CSV
def update_power_data(power_watts):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Add to recent readings
    global recent_power_readings
    recent_power_readings.append((timestamp, power_watts))
    
    # Keep only last 10 readings (5 minutes @ 30 second intervals)
    if len(recent_power_readings) > 10:
        recent_power_readings = recent_power_readings[-10:]
    
    # Update CSV
    with open(POWER_CSV_FILE, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["timestamp", "power_watts"])
        for ts, power in recent_power_readings:
            writer.writerow([ts, power])

# Async function to get Smart Plug energy data
async def get_kasa_data():
    retries = 3
    delay = 5
    for attempt in range(retries):
        try:
            plug = await Discover.discover_single(PLUG_IP)
            await plug.update()
            
            # Get realtime data
            emeter_data = await plug.get_emeter_realtime()
            current_power = emeter_data.get("power_mw", 0) / 1000
            total_energy = emeter_data.get("total_wh", 0) / 1000
            
            # Get daily stats
            daily_data = await plug.get_emeter_daily()
            today = datetime.now().day
            daily_energy = daily_data.get(today, 0) / 1000  # Convert Wh to kWh
            
            return {
                "current_power": current_power,
                "total_energy": total_energy,
                "daily_energy": daily_energy,
                "daily_data": daily_data
            }
        except Exception as e:
            logging.warning(f"Attempt {attempt + 1}/{retries}: Failed to fetch energy data. Error: {e}")
            await asyncio.sleep(delay)
    
    logging.error("All retries failed. Returning default values.")
    return {"current_power": 0, "total_energy": 0, "daily_energy": 0, "daily_data": {}}

# Function to update all data every 30 seconds
def update_all_data():
    global today_total_energy, daily_start_value, last_reset_day, today_hourly_energy, weekly_energy
    
    async def fetch_data():
        return await get_kasa_data()
    
    try:
        now = datetime.now()
        current_hour = now.hour
        current_day_idx = now.weekday()
        
        # Fetch data from Kasa device
        data = asyncio.run(fetch_data())
        current_power = data["current_power"]
        total_energy = data["total_energy"]
        daily_energy = data["daily_energy"]
        
        # Check if day has changed
        if now.day != last_reset_day:
            # Store yesterday's total for the weekly data
            yesterday_idx = (current_day_idx - 1) % 7
            weekly_energy[yesterday_idx] = today_total_energy
            
            # Reset daily counter
            today_total_energy = 0
            daily_start_value = daily_energy
            today_hourly_energy = [0] * 24
            last_reset_day = now.day
            
            # Update daily data CSV
            update_daily_energy_data()
        
        # Calculate today's energy consumption
        today_total_energy = daily_energy
        
        # Update hourly energy data
        today_hourly_energy[current_hour] = daily_energy
        
        # Update weekly energy data for current day
        weekly_energy[current_day_idx] = daily_energy
        
        # Calculate running sum (for logging purposes)
        running_sum = today_total_energy
        
        # Log to main CSV file
        log_energy_data(current_power, total_energy, daily_energy, running_sum)
        
        # Update power data
        update_power_data(current_power)
        
        # Update hourly and daily CSV files
        update_hourly_energy_data()
        update_daily_energy_data()
        
    except Exception as e:
        logging.error(f"Error updating data: {e}")

# Check historical energy data to get baseline values
def initialize_baseline_values():
    global today_total_energy, daily_start_value, last_reset_day, weekly_energy
    
    async def fetch_initial_data():
        return await get_kasa_data()
    
    try:
        # Get current values from Kasa
        data = asyncio.run(fetch_initial_data())
        daily_energy = data["daily_energy"]
        
        # Set initial values
        today_total_energy = daily_energy
        daily_start_value = 0  # We start tracking from current value
        last_reset_day = datetime.now().day
        
        # Load daily data if available
        if os.path.exists(DAILY_ENERGY_CSV):
            df = pd.read_csv(DAILY_ENERGY_CSV)
            days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            
            for i, day in enumerate(days):
                row = df[df["day"] == day]
                if not row.empty:
                    weekly_energy[i] = row.iloc[0]["energy_kwh"]
        
        # Update current day's energy
        current_day_idx = datetime.now().weekday()
        weekly_energy[current_day_idx] = daily_energy
        
    except Exception as e:
        logging.error(f"Error initializing baseline values: {e}")

# Start Background Scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(update_all_data, "interval", seconds=30, coalesce=True, max_instances=1)
scheduler.start()

# Flask API Routes
@app.before_request
def log_request_info():
    logging.info(f"Request: {request.method} {request.url}")

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to the Smart Plug Energy Monitoring API"}), 200

@app.route("/favicon.ico")
def favicon():
    return "", 204

@app.route("/energy", methods=["GET"])
def energy_readings():
    if not os.path.exists(ENERGY_CSV_FILE):
        return jsonify({"error": "No data available"}), 404
    
    with open(ENERGY_CSV_FILE, mode="r", newline="") as file:
        reader = list(csv.reader(file))
        if len(reader) <= 1:
            return jsonify({"error": "No data recorded yet"}), 404
        
        last_entry = reader[-1]
        return jsonify({
            "timestamp": last_entry[0],
            "current_power": float(last_entry[1]),
            "total_energy": float(last_entry[2]),
            "daily_energy": float(last_entry[3]),
            "running_energy_sum": float(last_entry[4])
        }), 200

@app.route("/energy_daily", methods=["GET"])
def energy_daily():
    """
    Get today's total energy consumption so far
    """
    try:
        async def fetch_daily_energy():
            data = await get_kasa_data()
            return data["daily_energy"]
        
        daily_energy = asyncio.run(fetch_daily_energy())
        
        return jsonify({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "daily_energy_kwh": daily_energy,
            "day": datetime.now().strftime("%A")
        }), 200
    except Exception as e:
        logging.error(f"Error in /energy_daily: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/energy/hourly", methods=["GET"])
def get_hourly_energy():
    """
    Get today's energy consumption broken down by hour (0-23)
    """
    try:
        if not os.path.exists(HOURLY_ENERGY_CSV):
            return jsonify({"error": "No hourly data available"}), 404
        
        df = pd.read_csv(HOURLY_ENERGY_CSV)
        df = df.sort_values("hour")
        
        # Format for frontend use
        hourly_data = {
            "hours": df["hour"].tolist(),
            "values": df["energy_kwh"].tolist(),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        return jsonify(hourly_data), 200
    except Exception as e:
        logging.error(f"Error in /energy/hourly: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/energy/daily", methods=["GET"])
def get_daily_energy():
    """
    Get energy data for each day of the week (Mon-Sun)
    """
    try:
        if not os.path.exists(DAILY_ENERGY_CSV):
            return jsonify({"error": "No daily data available"}), 404
        
        df = pd.read_csv(DAILY_ENERGY_CSV)
        
        # Ensure days are in correct order
        days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        df["day"] = pd.Categorical(df["day"], categories=days_order, ordered=True)
        df = df.sort_values("day")
        
        # Format for frontend use
        daily_data = {
            "days": df["day"].tolist(),
            "values": df["energy_kwh"].tolist(),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        return jsonify(daily_data), 200
        
    except Exception as e:
        logging.error(f"Error in /energy/daily: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/energy/current_power", methods=["GET"])
def get_current_power():
    """
    Get power data for the last 5 minutes (30-second intervals)
    """
    try:
        if not os.path.exists(POWER_CSV_FILE):
            return jsonify({"error": "No power data available"}), 404
        
        df = pd.read_csv(POWER_CSV_FILE, parse_dates=["timestamp"])
        
        # Get most recent readings (up to 10 = 5 minutes worth)
        df = df.tail(10).copy()
        
        # Format for frontend use
        power_data = {
            "timestamps": [ts.strftime("%H:%M:%S") for ts in df["timestamp"]],
            "values": df["power_watts"].tolist(),
            "current_value": df["power_watts"].iloc[-1] if not df.empty else 0,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        return jsonify(power_data), 200
    except Exception as e:
        logging.error(f"Error in /energy/current_power: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/energy/alert", methods=["GET"])
def energy_alert():
    """
    Check if today's energy usage is above the rolling average
    """
    try:
        # Get today's energy
        async def fetch_daily_energy():
            data = await get_kasa_data()
            return data["daily_energy"]
        
        today_energy = asyncio.run(fetch_daily_energy())
        
        # Calculate rolling average from weekly data
        if os.path.exists(DAILY_ENERGY_CSV):
            df = pd.read_csv(DAILY_ENERGY_CSV)
            # Exclude zeros when calculating average
            non_zero_values = df[df["energy_kwh"] > 0]["energy_kwh"]
            rolling_avg = non_zero_values.mean() if len(non_zero_values) > 0 else 0
        else:
            rolling_avg = 0
        
        # Check if today's usage is above average
        is_above_average = today_energy > rolling_avg if rolling_avg > 0 else False
        
        return jsonify({
            "is_above_average": bool(is_above_average),
            "today_energy_kwh": today_energy,
            "rolling_average_kwh": round(rolling_avg, 3),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }), 200
    except Exception as e:
        logging.error(f"Error in /energy/alert: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/download_csv", methods=["GET"])
def download_csv():
    """
    Download a CSV file
    """
    file_type = request.args.get("type", "energy")
    
    if file_type == "energy":
        file_path = ENERGY_CSV_FILE
    elif file_type == "hourly":
        file_path = HOURLY_ENERGY_CSV
    elif file_type == "daily":
        file_path = DAILY_ENERGY_CSV
    elif file_type == "power":
        file_path = POWER_CSV_FILE
    else:
        return jsonify({"error": "Invalid file type"}), 400
    
    if not os.path.exists(file_path):
        return jsonify({"error": "File not available"}), 404
    
    return send_file(file_path, as_attachment=True)

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
    try:
        data = request.json
        action = data.get("action")
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

# Initialize everything
initialize_csv_files()
initialize_baseline_values()

# Run Flask app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)
