from picamera2 import Picamera2, Preview
import time

camera = Picamera2()
camera.start()
time.sleep(2)
camera.capture_file("test_image.jpg")
print("Image captured as test_image.jpg")
camera.close()

camera = Picamera2()
camera.start_preview(Preview.QTGL)
camera.start()
print("Recording video for 10 seconds...")
time.sleep(10)
camera.stop_preview()
camera.close()
print("Video capture completed.")
