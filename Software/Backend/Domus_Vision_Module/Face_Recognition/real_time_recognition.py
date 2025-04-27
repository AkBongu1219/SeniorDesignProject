import face_recognition
import cv2
import pickle
import time
import sqlite3
from datetime import datetime
from flask import Flask, jsonify
from flask_socketio import SocketIO, emit
from threading import Thread
from queue import Queue
import os

# ---------- Configuration ---------- #

# Replace with your actual IP
STREAM_URL = "http://domus-streamer.local:5000/video_feed"  # MJPEG stream from Pi 4

DB_PATH = "security_events.db"
headless = True  # Force headless mode for systemd (do not use OpenCV GUI)

# ---------- Initialize Flask and SocketIO ---------- #

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# ---------- Initialize SQLite Database ---------- #

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS breach_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# ---------- Load Face Encoding ---------- #

with open("face_encoding.pkl", "rb") as file:
    known_face_encoding = pickle.load(file)

# ---------- OpenCV Video Capture ---------- #

cap = cv2.VideoCapture(STREAM_URL)
if not cap.isOpened():
    print("Failed to open MJPEG stream. Check if the Pi 4 stream is running.")
    exit(1)

# ---------- Queue & Threads ---------- #

frame_queue = Queue(maxsize=5)

print("Starting real-time face recognition with WebSocket alerts.")

def capture_frames():
    """Capture frames from the HTTP stream."""
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to capture frame. Retrying...")
            time.sleep(0.1)
            continue

        if not frame_queue.full():
            frame_queue.put(frame)

def process_frames():
    """Process frames for face recognition."""
    while True:
        if not frame_queue.empty():
            frame = frame_queue.get()

            # Convert to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Face detection
            face_locations = face_recognition.face_locations(rgb_frame)
            face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

            for face_encoding in face_encodings:
                matches = face_recognition.compare_faces([known_face_encoding], face_encoding)
                if matches[0]:
                    print("Authorized person detected.")
                    socketio.emit("alert", {"message": "Authorized person detected."})
                else:
                    print("Alert: Unknown face detected!")
                    socketio.emit("alert", {
                        "message": "Unknown person detected!",
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    })
                    # Save to DB
                    conn = sqlite3.connect(DB_PATH)
                    cursor = conn.cursor()
                    cursor.execute('''
                        INSERT INTO breach_events (timestamp) VALUES (?)
                    ''', (datetime.now().strftime("%Y-%m-%d %H:%M:%S"),))
                    conn.commit()
                    conn.close()

            # Skip OpenCV GUI calls in headless mode
            if not headless:
                cv2.imshow("Real-Time Face Recognition", frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

    cap.release()
    # Skip OpenCV window cleanup in headless mode
    if not headless:
        cv2.destroyAllWindows()

# ---------- Optional API to Get Last Breach ---------- #

@app.route('/security-status', methods=['GET'])
def get_security_status():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT timestamp FROM breach_events ORDER BY timestamp DESC LIMIT 1')
    result = cursor.fetchone()
    conn.close()

    if result:
        return jsonify({
            "status": "Security Alert: Unknown face detected",
            "timestamp": result[0]
        })
    else:
        return jsonify({
            "status": None,
            "timestamp": None
        })

@app.route('/')
def index():
    return "Face recognition with WebSocket alerts is running."

# ---------- Start Threads and Server ---------- #

if __name__ == '__main__':
    capture_thread = Thread(target=capture_frames, daemon=True)
    process_thread = Thread(target=process_frames, daemon=True)

    capture_thread.start()
    process_thread.start()

    socketio.run(app, host='0.0.0.0', port=5001, allow_unsafe_werkzeug=True)
