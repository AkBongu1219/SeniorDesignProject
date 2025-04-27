import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Feather from "react-native-vector-icons/Feather";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_SERVER_URL = "http://domus-central.local:5001";

interface SecurityStatusCardProps {
  lastRefresh?: number;
}

export default function SecurityStatusCard({ lastRefresh }: SecurityStatusCardProps) {
  // State to hold the alert message (null means no alert)
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Load cached alert status on mount and when refresh is triggered
  useEffect(() => {
    const loadCachedAlert = async () => {
      try {
        const cached = await AsyncStorage.getItem("securityAlert");
        if (cached !== null) {
          setAlertMessage(cached);
        }
      } catch (error) {
        console.error("Error loading cached alert:", error);
      }
    };
    loadCachedAlert();
  }, [lastRefresh]);

  // Connect to socket and update alert status
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);
    socket.on("alert", (data: { message: string }) => {
      if (data.message === "Authorized person detected.") {
        setAlertMessage(null); // Clear alert
        AsyncStorage.removeItem("securityAlert");
      } else {
        setAlertMessage(data.message);
        AsyncStorage.setItem("securityAlert", data.message);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const isAlert = alertMessage !== null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Security Status</Text>

      <View
        style={[
          styles.statusContainer,
          isAlert ? styles.alertBackground : styles.safeBackground,
        ]}
      >
        <Feather
          name={isAlert ? "alert-triangle" : "lock"}
          size={18}
          color={isAlert ? "#D32F2F" : "#388E3C"}
          style={styles.icon}
        />
        <Text
          style={[
            styles.statusText,
            isAlert ? styles.alertText : styles.safeText,
          ]}
        >
          {isAlert ? "Alert: Security Breached" : "All Clear"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    padding: 14,
    borderRadius: 14,
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  safeBackground: {
    backgroundColor: "#E8F5E9", // Light mint green
  },
  alertBackground: {
    backgroundColor: "#FFEBEE", // Light red
  },
  statusText: {
    fontSize: 18, // Same as title
    fontWeight: "600", // Match title weight
  },
  safeText: {
    color: "#388E3C",
  },
  alertText: {
    color: "#D32F2F",
  },
});
