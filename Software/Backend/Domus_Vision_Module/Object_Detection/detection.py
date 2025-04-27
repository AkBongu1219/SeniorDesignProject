import cv2

cap = cv2.VideoCapture(0, cv2.CAP_V4L2)

if not cap.isOpened():
    print("ERROR: Could not open the camera!")
else:
    ret, frame = cap.read()
    if not ret:
        print("ERROR: Camera did not return a frame!")
    else:
        print("Frame captured successfully! Saving as 'test.jpg'...")
        cv2.imwrite("test.jpg", frame)

cap.release()
