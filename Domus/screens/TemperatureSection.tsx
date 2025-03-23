import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import AQIMeter from "../components/AQIMeter"; // Import AQI meter

interface BME688Data {
  temperature: number;
  humidity: number;
  pressure: number;
  gas_resistance: number; // Now this directly represents AQI
}

// Function to determine AQI category and color
const getAQICategory = (aqi: number) => {
  if (aqi <= 50) return { quality: "Good", color: "green" };
  if (aqi <= 100) return { quality: "Moderate", color: "yellow" };
  if (aqi <= 150) return { quality: "Unhealthy (Sensitive)", color: "orange" };
  if (aqi <= 200) return { quality: "Unhealthy", color: "red" };
  if (aqi <= 300) return { quality: "Very Unhealthy", color: "purple" };
  return { quality: "Hazardous", color: "maroon" };
};

const SensorDataScreen = () => {
  const [sensorData, setSensorData] = useState<BME688Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch("http://192.168.1.152:5000/bme688-latest");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: BME688Data = await response.json();
        setSensorData(data);
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Get AQI category and color
  const aqiInfo = sensorData ? getAQICategory(sensorData.gas_resistance) : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BME688 Sensor Data</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          {aqiInfo && <AQIMeter aqi={sensorData!.gas_resistance} quality={aqiInfo.quality} color={aqiInfo.color} />}
          <View style={styles.content}>
            <View style={styles.box}>
              <Text style={styles.boxTitle}>Temperature</Text>
              <Text style={styles.boxValue}>{sensorData?.temperature ?? "--"} °C</Text>
            </View>
            <View style={styles.box}>
              <Text style={styles.boxTitle}>Humidity</Text>
              <Text style={styles.boxValue}>{sensorData?.humidity ?? "--"} %</Text>
            </View>
            <View style={styles.box}>
              <Text style={styles.boxTitle}>Pressure</Text>
              <Text style={styles.boxValue}>{sensorData?.pressure ?? "--"} hPa</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  content: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  box: {
    padding: 16,
    borderRadius: 8,
    width: "45%",
    margin: 5,
    alignItems: "center",
  },
  boxTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 8,
    textAlign: "center",
  },
  boxValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1976D2",
  },
});

export default SensorDataScreen;