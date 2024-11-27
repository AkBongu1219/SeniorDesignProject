import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const SensorDataScreen = () => {
  const [temperature, setTemperature] = useState('--');
  const [humidity, setHumidity] = useState('--');
  const [pressure, setPressure] = useState('--');
  const [gasResistance, setGasResistance] = useState('--');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bme688ApiUrl = 'http://172.20.10.2:5000/bme688-latest'; // Change this to match your Pi's IP
    const fetchData = async () => {
      try {
        const response = await fetch(bme688ApiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setTemperature(data.temperature);
        setHumidity(data.humidity);
        setPressure(data.pressure);
        setGasResistance(data.gas_resistance);
      } catch (error) {
        console.error('Error fetching BME688 data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sensor Data</Text>
      <Text style={styles.text}>Temperature: {temperature} °C</Text>
      <Text style={styles.text}>Humidity: {humidity} %</Text>
      <Text style={styles.text}>Pressure: {pressure} hPa</Text>
      <Text style={styles.text}>Gas Resistance: {gasResistance} Ω</Text>
    </SafeAreaView>
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
