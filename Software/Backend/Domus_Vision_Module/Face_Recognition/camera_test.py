from picamera2 import Picamera2
import cv2

# Initialize the camera
picam2 = Picamera2()
picam2.configure(picam2.create_preview_configuration())

# Start the camera
picam2.start()

while True:
    # Capture a frame
    frame = picam2.capture_array()

    # Flip the frame horizontally (mirror effect)
    frame = cv2.flip(frame, 1)

    # Display the frame
    cv2.imshow("Mirrored Camera Feed", frame)

    # Break loop on 'q' key press
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Stop the camera and close windows
picam2.stop()
cv2.destroyAllWindows()

