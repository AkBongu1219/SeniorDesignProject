from flask import Flask, request, jsonify, make_response
import sqlite3
from datetime import datetime, timedelta
import threading
import time
import os

app = Flask(__name__)
DATABASE = 'domus.db'

# ---------------- Database ---------------- #

def get_db_connection():
    conn = sqlite3.connect(DATABASE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS BME688Data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            temperature REAL,
            humidity REAL,
            pressure REAL,
            gas_resistance REAL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS MotionData (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            motion TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS devices (
            device_id TEXT PRIMARY KEY,
            ip TEXT,
            last_seen REAL
        )
    ''')

    conn.commit()
    conn.close()

# ---------------- Background Task for Motion Reset ---------------- #

last_motion_time = None

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
        time.sleep(1)

# ---------------- BME688 Sensor Endpoints ---------------- #

@app.route('/bme688-data', methods=['POST'])
def receive_bme688_data():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()

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

    print("Received BME688 Data:", data)
    return jsonify({"status": "success"})

@app.route('/bme688-latest', methods=['GET'])
def get_latest_bme688_data():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM BME688Data ORDER BY timestamp DESC LIMIT 1')
        data = cursor.fetchone()
        conn.close()

        if data:
            response = make_response(jsonify(dict(data)))
        else:
            response = make_response(jsonify({
                "temperature": 0,
                "humidity": 0,
                "pressure": 0,
                "gas_resistance": 0,
                "timestamp": None,
                "message": "No recent sensor data"
            }))
        response.headers['Cache-Control'] = 'no-store'
        return response
    except Exception as e:
        print("Error in /bme688-latest:", str(e))
        return jsonify({"error": "Internal server error"}), 500

# ---------------- Motion Endpoints ---------------- #

@app.route('/motion-data', methods=['POST'])
def receive_motion_data():
    global last_motion_time
    data = request.get_json()
    motion_status = data.get("motion", "no motion")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO MotionData (timestamp, motion)
        VALUES (?, ?)
    ''', (
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        motion_status
    ))
    conn.commit()
    conn.close()

    if motion_status == "motion detected":
        last_motion_time = datetime.now()

    print("Received Motion:", motion_status)
    return jsonify({"status": "success"})

@app.route('/motion-latest', methods=['GET'])
def get_latest_motion_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT motion, timestamp FROM MotionData ORDER BY timestamp DESC LIMIT 1')
    data = cursor.fetchone()
    conn.close()

    return jsonify({"motion": data[0], "timestamp": data[1]}) if data else jsonify({"motion": "no motion", "timestamp": None})

# ---------------- Device Check-In ---------------- #

@app.route('/device-checkin', methods=['POST'])
def device_checkin():
    data = request.get_json(force=True)
    device_id = data.get('device_id')
    if not device_id:
        return jsonify({"error": "Missing device_id"}), 400

    ip = request.remote_addr
    last_seen = time.time()

    conn = get_db_connection()
    conn.execute('''
        INSERT INTO devices (device_id, ip, last_seen)
        VALUES (?, ?, ?)
        ON CONFLICT(device_id) DO UPDATE SET
            ip = excluded.ip,
            last_seen = excluded.last_seen;
    ''', (device_id, ip, last_seen))
    conn.commit()
    conn.close()

    print(f"Device {device_id} checked in from {ip} at {last_seen}")
    return jsonify({"message": "Check-in successful"}), 200

@app.route('/devices', methods=['GET'])
def list_devices():
    cutoff = time.time() - 60
    conn = get_db_connection()
    cursor = conn.execute('SELECT * FROM devices WHERE last_seen >= ?', (cutoff,))
    rows = cursor.fetchall()
    conn.close()

    devices = {
        row['device_id']: {
            "ip": row["ip"],
            "lastSeen": row["last_seen"]
        }
        for row in rows
    }
    return jsonify(devices), 200

# ---------------- Start Server ---------------- #

if __name__ == '__main__':
    init_db()
    thread = threading.Thread(target=reset_motion_status, daemon=True)
    thread.start()
    app.run(host='0.0.0.0', port=5000)
