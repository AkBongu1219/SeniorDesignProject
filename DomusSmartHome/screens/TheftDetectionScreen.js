import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import io from 'socket.io-client';

const TheftDetectionScreen = () => {
  const [alerts, setAlerts] = useState([]);
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  useEffect(() => {
    const socket = io('http://172.20.10.2:5002');

    socket.on('alert', (data) => {
      console.log('Alert received:', data.message);

      // Prevent multiple alerts
      if (!isAlertVisible) {
        setIsAlertVisible(true);
        setAlerts((prevAlerts) => [data.message, ...prevAlerts]);

        Alert.alert(
          'Theft Detection Alert',
          data.message,
          [
            {
              text: 'OK',
              onPress: () => setIsAlertVisible(false), // Dismiss and allow new alerts
            },
          ],
          { cancelable: false }
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isAlertVisible]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Theft Detection Alerts</Text>
      <ScrollView style={styles.alertsContainer}>
        {alerts.map((alert, index) => (
          <Text key={index} style={styles.alertText}>
            {alert}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  alertsContainer: {
    flex: 1,
    marginTop: 10,
  },
  alertText: {
    fontSize: 18,
    marginVertical: 5,
    padding: 10,
    backgroundColor: '#ffc107',
    borderRadius: 8,
    color: '#000',
  },
});

export default TheftDetectionScreen;
