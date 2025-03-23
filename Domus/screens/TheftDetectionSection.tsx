import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, Alert } from "react-native";
import io from "socket.io-client";

const SOCKET_SERVER_URL = "http://192.168.1.161:5001"; // Your actual socket server URL

const TheftDetectionSection = () => {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);
    
    socket.on("alert", (data) => {
      if (!isAlertVisible) {
        setIsAlertVisible(true);
        setAlertMessage(data.message);
        Alert.alert("Theft Detection Alert", data.message, [
          {
            text: "OK",
            onPress: () => setIsAlertVisible(false),
          },
        ]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isAlertVisible]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Theft Detection</Text>
      <View style={styles.content}>
        <Image source={{ uri: "https://via.placeholder.com/300x200" }} style={styles.image} />
        <View style={[styles.statusContainer, alertMessage ? styles.alertBackground : styles.safeBackground]}>
          <Text style={[styles.statusText, alertMessage ? styles.alertText : styles.safeText]}>
            {alertMessage ? alertMessage : "No Intruder Detected"}
          </Text>
        </View>
      </View>
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
    flexDirection: "column",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusContainer: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    width: "90%",
  },
  safeBackground: {
    backgroundColor: "#E8F5E9", // Light green for safe state
  },
  alertBackground: {
    backgroundColor: "#FFCDD2", // Light red when intruder detected
  },
  statusText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  safeText: {
    color: "#4CAF50",
  },
  alertText: {
    color: "#D32F2F",
  },
});

export default TheftDetectionSection;