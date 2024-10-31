import RPi.GPIO as GPIO
import time

# Define the GPIO pin
PIR_PIN = 17  # GPIO17 corresponds to pin 11 on the Raspberry Pi

# Setup GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(PIR_PIN, GPIO.IN)

def main():
    try:
        print("Starting motion sensor monitoring...")
        while True:
            # Read PIR sensor
            if GPIO.input(PIR_PIN):
                print("Motion Detected!")
            else:
                print("No Motion")
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("Exiting program.")
    finally:
        GPIO.cleanup()

if __name__ == "__main__":
    main()
