import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const SensorDataScreen = () => {
  const [temperature, setTemperature] = useState('--');
  const [humidity, setHumidity] = useState('--');
  const [pressure, setPressure] = useState('--');
  const [gasResistance, setGasResistance] = useState('--');
  const [motion, setMotion] = useState('--');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bme688ApiUrl = 'http://172.20.10.2:5000/bme688-latest'; // Replace with your Pi's IP for BME688
    const motionApiUrl = 'http://172.20.10.2:5000/motion-latest'; // Replace with your Pi's IP for Motion

    const fetchData = async () => {
      try {
        // Fetch BME688 data
        const responseBME = await fetch(bme688ApiUrl);
        if (!responseBME.ok) throw new Error(`BME688 HTTP error! status: ${responseBME.status}`);
        const dataBME = await responseBME.json();
        setTemperature(dataBME.temperature);
        setHumidity(dataBME.humidity);
        setPressure(dataBME.pressure);
        setGasResistance(dataBME.gas_resistance);

        // Fetch motion data
        const responseMotion = await fetch(motionApiUrl);
        if (!responseMotion.ok) throw new Error(`Motion HTTP error! status: ${responseMotion.status}`);
        const dataMotion = await responseMotion.json();
        setMotion(dataMotion.motion);
      } catch (error) {
        console.error('Error fetching sensor data:', error);
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
      <Text style={styles.text}>Motion: {motion}</Text>
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
