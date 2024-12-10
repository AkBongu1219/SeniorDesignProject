from flask import Flask, request, jsonify
import sqlite3
from datetime import datetime, timedelta
import threading

app = Flask(__name__)

# Helper function to connect to the SQLite database
def get_db_connection():
    conn = sqlite3.connect('smart_home.db')
    conn.row_factory = sqlite3.Row  # Enables dict-like access to rows
    return conn

# Global variable to track the last motion detection time
last_motion_time = None

# Function to reset motion status to "no motion" after 3 seconds
def reset_motion_status():
    global last_motion_time
    while True:
        if last_motion_time and datetime.now() - last_motion_time > timedelta(seconds=3):
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO MotionData (timestamp, motion)
                VALUES (?, ?)
            ''', (
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "no motion"
            ))
            conn.commit()
            conn.close()
            print("Motion reset to 'no motion'")
            last_motion_time = None

# Start the reset_motion_status function in a background thread
reset_thread = threading.Thread(target=reset_motion_status, daemon=True)
reset_thread.start()

# Endpoint for receiving BME688 data and storing it in the database
@app.route('/bme688-data', methods=['POST'])
def receive_bme688_data():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Insert the received data into the BME688Data table
    cursor.execute('''
        INSERT INTO BME688Data (timestamp, temperature, humidity, pressure, gas_resistance)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        data.get("temperature"),
        data.get("humidity"),
        data.get("pressure"),
        data.get("gas_resistance")
    ))
    conn.commit()
    conn.close()

    print("Received BME688 Data and stored in DB:", data)
    return jsonify({"status": "success"})

# Endpoint to retrieve the latest data from the BME688Data table
@app.route('/bme688-latest', methods=['GET'])
def get_latest_bme688_data():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch the most recent entry
    cursor.execute('''
        SELECT * FROM BME688Data ORDER BY timestamp DESC LIMIT 1
    ''')
    data = cursor.fetchone()
    conn.close()

    if data:
        return jsonify(dict(data))
    else:
        return jsonify({"error": "No data available"}), 404

# Endpoint for receiving motion data and storing it in the database
@app.route('/motion-data', methods=['POST'])
def receive_motion_data():
    global last_motion_time
    data = request.get_json()
    motion_status = data.get("motion", "no motion")

    conn = get_db_connection()
    cursor = conn.cursor()

    # Insert the received motion data into the MotionData table
    cursor.execute('''
        INSERT INTO MotionData (timestamp, motion)
        VALUES (?, ?)
    ''', (
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        motion_status
    ))
    conn.commit()
    conn.close()

    print("Received Motion Data and stored in DB:", motion_status)

    # Update the last motion detection time if motion is detected
    if motion_status == "motion detected":
        last_motion_time = datetime.now()

    return jsonify({"status": "success"})

# Endpoint to retrieve the latest motion data
@app.route('/motion-latest', methods=['GET'])
def get_latest_motion_data():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch the most recent motion data entry
    cursor.execute('''
        SELECT motion, timestamp FROM MotionData
        ORDER BY timestamp DESC LIMIT 1
    ''')
    data = cursor.fetchone()
    conn.close()

    if data:
        return jsonify({"motion": data[0], "timestamp": data[1]})
    else:
        return jsonify({"motion": "no motion", "timestamp": None})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
