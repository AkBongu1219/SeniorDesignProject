import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Define TypeScript interface for BME688 API response
interface BME688Data {
  temperature: number;
  humidity: number;
  pressure: number;
  gas_resistance: number;
}

const SensorDataScreen = () => {
  // State variables with explicit types for BME688 sensor data
  const [sensorData, setSensorData] = useState<BME688Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bme688ApiUrl = 'http://172.20.10.4:5000/bme688-latest';

    const fetchSensorData = async () => {
      try {
        const response = await fetch(bme688ApiUrl);
        if (!response.ok) throw new Error(`BME688 HTTP error! status: ${response.status}`);
        const data: BME688Data = await response.json();
        setSensorData(data);
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSensorData();

    // Auto-refresh data every 10 seconds
    const interval = setInterval(fetchSensorData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  // Render sensor data once loaded
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>BME688 Sensor Data</Text>
      <Text style={styles.text}>Temperature: {sensorData?.temperature ?? '--'} °C</Text>
      <Text style={styles.text}>Humidity: {sensorData?.humidity ?? '--'} %</Text>
      <Text style={styles.text}>Pressure: {sensorData?.pressure ?? '--'} hPa</Text>
      <Text style={styles.text}>Gas Resistance: {sensorData?.gas_resistance ?? '--'} Ω</Text>
    </SafeAreaView>
  );
};

// UI Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    marginVertical: 5,
  },
});

export default SensorDataScreen;