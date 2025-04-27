import cv2
import numpy as np
import tflite_runtime.interpreter as tfl
import sqlite3
from datetime import datetime

# Load COCO labels
with open("/home/raspberrypi/Object_detection_project/coco_labels.txt", "r") as f:
    labels = [line.strip() for line in f.readlines()]

# Load Object Detection Model
interpreter = tfl.Interpreter(model_path="/home/raspberrypi/Object_detection_project/mobilenet_ssd_v2_coco_quant_postprocess.tflite")
interpreter.allocate_tensors()

# Connect to SQLite Database
db_path = "/home/raspberrypi/Object_detection_project/detections.db"

# MJPEG stream URL from Pi 4
stream_url = "http://domus-streamer.local:5000/video_feed"
cap = cv2.VideoCapture(stream_url)

if not cap.isOpened():
    print("ERROR: Could not open video stream.")
    exit()

def save_detection(label, confidence):
    """ Save detected object with timestamp into SQLite database """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get the current timestamp in the correct format
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    cursor.execute("INSERT INTO detections (object_label, confidence, timestamp) VALUES (?, ?, ?)", 
                   (label, confidence, timestamp))
    conn.commit()
    conn.close()


def detect_objects(image):
    """ Run Object Detection Model """
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    height, width = input_details[0]['shape'][1], input_details[0]['shape'][2]
    image_resized = cv2.resize(image, (width, height))
    input_data = np.expand_dims(image_resized, axis=0).astype(np.uint8)

    # Run inference
    interpreter.set_tensor(input_details[0]['index'], input_data)
    interpreter.invoke()
    
    # Get detected objects
    boxes = interpreter.get_tensor(output_details[0]['index'])[0]  # Bounding box coordinates
    class_ids = interpreter.get_tensor(output_details[1]['index'])[0]  # Class IDs
    scores = interpreter.get_tensor(output_details[2]['index'])[0]  # Confidence scores

    return boxes, class_ids, scores

print("Streaming live video from MJPEG stream with Object Detection...")
while True:
    ret, frame = cap.read()
    if not ret:
        print("ERROR: No frame received.")
        break

    # Run Object Detection
    boxes, class_ids, scores = detect_objects(frame)

    # Draw bounding boxes & labels
    for i in range(len(scores)):
        if scores[i] > 0.5:  # Confidence threshold
            ymin, xmin, ymax, xmax = boxes[i]
            xmin, xmax = int(xmin * frame.shape[1]), int(xmax * frame.shape[1])
            ymin, ymax = int(ymin * frame.shape[0]), int(ymax * frame.shape[0])
            
            label = labels[int(class_ids[i])] if int(class_ids[i]) < len(labels) else "Unknown"
            confidence = int(scores[i] * 100)
            text = f"{label}: {confidence}%"

            # Store detection in the database
            save_detection(label, confidence)

            cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), (0, 255, 0), 2)
            cv2.putText(frame, text, (xmin, ymin - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    cv2.imshow("Live Stream with Object Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
