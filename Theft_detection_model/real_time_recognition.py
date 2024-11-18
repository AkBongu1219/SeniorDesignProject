import face_recognition
import cv2
import pickle
import time
from flask import Flask
from flask_socketio import SocketIO, emit
from threading import Thread
from queue import Queue

# Initialize Flask app and SocketIO
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow cross-origin requests for testing

# Load saved face encoding
with open("face_encoding.pkl", "rb") as file:
    known_face_encoding = pickle.load(file)

# GStreamer pipeline for the Pi 4 stream
STREAM_URL = (
    "udpsrc port=5000 ! application/x-rtp,encoding-name=H264 ! "
    "rtph264depay ! avdec_h264 ! videoconvert ! appsink"
)

# Initialize GStreamer-based video capture
cap = cv2.VideoCapture(STREAM_URL, cv2.CAP_GSTREAMER)
if not cap.isOpened():
    print("Failed to open GStreamer stream. Check if the Pi 4 stream is active.")
    exit(1)

# Frame queue
frame_queue = Queue(maxsize=5)  # Limit the queue size to prevent memory overflow

print("Starting real-time face recognition with WebSocket alerts.")

def capture_frames():
    """Capture frames from the GStreamer stream and put them in the queue."""
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to capture frame from stream. Retrying...")
            time.sleep(0.1)  # Prevent tight-looping on failure
            continue
       
        if not frame_queue.full():
            frame_queue.put(frame)

def process_frames():
    """Process frames for face recognition."""
    while True:
        if not frame_queue.empty():
            frame = frame_queue.get()

            # Convert to RGB for face recognition
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Perform face detection and recognition
            face_locations = face_recognition.face_locations(rgb_frame)
            face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

            for face_encoding in face_encodings:
                matches = face_recognition.compare_faces([known_face_encoding], face_encoding)
                if matches[0]:
                    print("Authorized person detected.")
                    socketio.emit("alert", {"message": "Authorized person detected."})
                else:
                    print("Alert: Unknown face detected!")
                    socketio.emit("alert", {"message": "Unknown person detected!"})

            # Display the frame (optional, for debugging)
            cv2.imshow("Real-Time Face Recognition", frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()

@app.route('/')
def index():
    """Default route."""
    return "Face recognition with WebSocket alerts is running."

if __name__ == '__main__':
    # Start threads for frame capture and processing
    capture_thread = Thread(target=capture_frames, daemon=True)
    process_thread = Thread(target=process_frames, daemon=True)
   
    capture_thread.start()
    process_thread.start()

    # Start Flask-SocketIO app
    socketio.run(app, host='0.0.0.0', port=5002)
