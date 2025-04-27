#!/bin/bash

# ESP32 Flashing Script (Arduino CLI)
# Make sure to adjust your PORT and BOARD values!

ARDUINO_CLI="arduino-cli"
BOARD="esp32:esp32:esp32wrooomda"
PORT="/dev/ttyUSB0"

# Compile and upload the motion sensor code
$ARDUINO_CLI compile --fqbn $BOARD ESP32_Code/motion_sensor_ESP32.ino
$ARDUINO_CLI upload -p $PORT --fqbn $BOARD ESP32_Code/motion_sensor_ESP32.ino

# Compile and upload the BME688 environment sensor code
$ARDUINO_CLI compile --fqbn $BOARD ESP32_Code/BME688_ESP32.ino
$ARDUINO_CLI upload -p $PORT --fqbn $BOARD ESP32_Code/BME688_ESP32.ino