import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const SensorDataScreen = () => {
  const [temperature, setTemperature] = useState('--');
  const [humidity, setHumidity] = useState('--');
  const [pressure, setPressure] = useState('--');
  const [gasResistance, setGasResistance] = useState('--');
  const [motion, setMotion] = useState('--');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Correct the API URL to use the /latest-data endpoint
    const apiUrl = 'http://172.20.10.2:5000/latest-data';
  
    const fetchData = async () => {
      try {
        console.log("Attempting to fetch data from", apiUrl);
        const response = await fetch(apiUrl);
  
        // Check if the response is ok (status code 200-299)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log("Data received:", data);
        setTemperature(data.BME688.temperature);
        setHumidity(data.BME688.humidity);
        setPressure(data.BME688.pressure);
        setGasResistance(data.BME688.gas_resistance);
        setMotion(data.motion);
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);
  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sensor Data</Text>
      <Text style={styles.text}>Temperature: {temperature} °C</Text>
      <Text style={styles.text}>Humidity: {humidity} %</Text>
      <Text style={styles.text}>Pressure: {pressure} hPa</Text>
      <Text style={styles.text}>Gas Resistance: {gasResistance} Ω</Text>
      <Text style={styles.text}>Motion: {motion}</Text>
    </View>
  );
};

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