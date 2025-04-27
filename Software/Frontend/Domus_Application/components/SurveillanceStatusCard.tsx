import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Feather from "react-native-vector-icons/Feather";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_SERVER_URL = "http://domus-central.local:5001";
const API_URL = "http://domus-central.local:5001";

export default function SurveillanceStatusCard() {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [breachTimestamp, setBreachTimestamp] = useState<string | null>(null);
  const [formattedTimeAgo, setFormattedTimeAgo] = useState<string | null>(null);

  // Format timestamp to "x minutes ago", etc.
  const formatTimeAgo = (timestamp: string) => {
    const breachTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - breachTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  };

  // Load cached alert status
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
  }, []);

  // Setup socket connection
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);
    socket.on("alert", (data: { message: string; timestamp?: string }) => {
      setAlertMessage(data.message);
      AsyncStorage.setItem("securityAlert", data.message);
      if (data.timestamp) {
        setBreachTimestamp(data.timestamp);
        setFormattedTimeAgo(formatTimeAgo(data.timestamp));
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch security status from backend
  useEffect(() => {
    const fetchSecurityStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/security-status`);
        const data = await response.json();
        if (data.status) {
          setAlertMessage(data.status);
        }
        if (data.timestamp) {
          setBreachTimestamp(data.timestamp);
          setFormattedTimeAgo(formatTimeAgo(data.timestamp));
        }
      } catch (error) {
        console.error("Error fetching security status:", error);
      }
    };
    fetchSecurityStatus();
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

      <Text style={styles.additionalInfo}>
        {isAlert
          ? `Last breach: ${formattedTimeAgo ?? "N/A"}`
          : "No Security Breaches in the past 24 hours"}
      </Text>
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
    backgroundColor: "#E8F5E9",
  },
  alertBackground: {
    backgroundColor: "#FFEBEE",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
  },
  safeText: {
    color: "#388E3C",
  },
  alertText: {
    color: "#D32F2F",
  },
  additionalInfo: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
    color: "#666",
  },
});