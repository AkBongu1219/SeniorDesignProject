import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

interface DeviceStatusCardProps {
  lastRefresh?: number;
}

export default function DeviceStatusCard({ lastRefresh }: DeviceStatusCardProps) {
  const [devices, setDevices] = useState<any[]>([]);
  const navigation = useNavigation();

  const getFriendlyName = (device_id: string) => {
    const id = device_id.toLowerCase();
    if (id === "domus-motionsensor") return "Domus MotionSensor";
    if (id === "domus-tempsensor" || id.includes("bme688") || id.includes("domus")) return "Domus TempSensor";
    return device_id;
  };

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch("http://domus-central.local:5000/devices");
        if (!response.ok) throw new Error("Failed to fetch devices");
        const data = await response.json();

        const fetchedDevices = Object.keys(data).map((device_id) => ({
          device_id,
          ...data[device_id],
        }));

        setDevices(fetchedDevices);
      } catch (error) {
        console.error("Error fetching devices:", error);
        setDevices([]); // fallback to empty
      }
    };

    fetchDevices();
  }, [lastRefresh]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Connected Devices</Text>

      {devices.length > 0 ? (
        devices.map((device, index) => (
          <View key={index} style={styles.deviceRow}>
            <Text style={styles.deviceName}>{getFriendlyName(device.device_id)}</Text>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, styles.dotActive]} />
              <Text style={[styles.statusText, styles.activeText]}>Active</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.infoText}>No active devices</Text>
      )}

      <TouchableOpacity
        style={styles.manageButton}
        onPress={() => navigation.navigate("Devices")}
      >
        <Text style={styles.manageButtonText}>Manage Devices</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  dotActive: {
    backgroundColor: "#4CAF50",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeText: {
    color: "#4CAF50",
  },
  manageButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    paddingVertical: 10,
  },
  manageButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  infoText: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginVertical: 10,
  },
});
