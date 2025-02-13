import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import axios from "axios";

const API_BASE = "http://10.0.0.63:8080"; // API for energy readings

const EnergyTrackingSection = () => {
  const [energyData, setEnergyData] = useState<{ current_power: number; total_energy: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEnergyData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/energy`);
      setEnergyData(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch energy readings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnergyData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!energyData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load energy data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Energy Tracking</Text>
      <View style={styles.content}>
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Current Power</Text>
          <Text style={styles.boxValue}>{energyData.current_power.toFixed(2)} W</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Energy Consumption</Text>
          <Text style={styles.boxValue}>{energyData.total_energy.toFixed(3)} kWh</Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
  },
  box: {
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
});

export default EnergyTrackingSection;