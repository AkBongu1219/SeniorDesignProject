from bme68x import BME68X
import time
import csv

sensor = BME68X(i2c_addr=0x76, use_bsec=1)

# Open the I2C connection and CSV file
try:
    # Open the CSV file in write mode and add headers
    with open("iaq_data.csv", mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Timestamp", "IAQ", "IAQ Accuracy"])

        if sensor.open_i2c(0x76) < 0:
            raise Exception("Failed to open I2C connection.")

        # Configure sensor settings (oversampling and filter settings)
        sensor.set_conf(os_hum=2, os_press=2, os_temp=2, filter=3, odr=100)
        
        # Set heater configuration
        temperature_profile = [300]  # Temperature for gas sensor in °C
        duration_profile = [100]      # Duration in ms

        sensor.set_heatr_conf(
            enable=1, 
            temperature_profile=temperature_profile,
            duration_profile=duration_profile, 
            operation_mode=BME68X_PARALLEL_MODE
        )

        # Set high-performance mode for air quality monitoring
        sensor.set_sample_rate(BSEC_SAMPLE_RATE_HIGH_PERFORMANCE)

        # Loop to continuously read air quality data
        while True:
            try:
                # Fetch data with BSEC processing
                data = sensor.get_bsec_data()

                # Get IAQ values
                iaq = data['iaq']
                iaq_accuracy = data['iaq_accuracy']

                # Get the current timestamp
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

                # Write IAQ data to CSV
                writer.writerow([timestamp, iaq, iaq_accuracy])

                # Print the results
                print(f"Timestamp: {timestamp}")
                print(f"IAQ: {iaq} (Accuracy: {iaq_accuracy})")
                print("---------------------------")

                # Sleep between samples (3 seconds for LP mode)
                time.sleep(3)

            except Exception as e:
                print(f"Error reading data: {e}")

except Exception as e:
    print(f"Initialization error: {e}")

finally:
    # Close the I2C connection
    sensor.close_i2c()
    print("I2C connection closed.")