import face_recognition
import cv2
import pickle
from picamera2 import Picamera2

# Load saved face encoding
with open("face_encoding.pkl", "rb") as file:
    known_face_encoding = pickle.load(file)

# Initializing camera 
picam2 = Picamera2()
picam2.configure(picam2.create_preview_configuration())
picam2.start()

print("Starting real-time face recognition. Press 'q' to quit.")

while True:
    # Capture a frame from the camera
    frame = picam2.capture_array()

    # Convert the frame to RGB 
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Find all face locations and face encodings in the RGB frame
    face_locations = face_recognition.face_locations(rgb_frame)
    face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

    # Looping through each face found in the frame
    for face_encoding in face_encodings:
        # Compare the detected face to the known face encoding
        matches = face_recognition.compare_faces([known_face_encoding], face_encoding)

        if matches[0]:
            print("Authorized person detected.")
        else:
            print("Alert: Unknown face detected!")

    # Display the frame with OpenCV 
    mirrored_frame = cv2.flip(frame, 1)
    cv2.imshow("Real-Time Face Recognition", mirrored_frame)

    # Break loop on 'q' key press
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Stopping camera 
picam2.stop()
cv2.destroyAllWindows()
