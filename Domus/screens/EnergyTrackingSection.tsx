import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, Button } from "react-native";
import axios from "axios";

const API_BASE = "http://192.168.1.163:8080"; // Flask API endpoint

const EnergyTrackingSection = () => {
  const [energyData, setEnergyData] = useState<{ current_power: number; total_energy: number; daily_energy: number }>({
    current_power: 0,
    total_energy: 0,
    daily_energy: 0,
  });
  const [plugState, setPlugState] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEnergyData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/energy`);
      console.log("Energy Data:", response.data); // Debugging line

      if (
        response.data &&
        typeof response.data.current_power === "number" &&
        typeof response.data.total_energy === "number" &&
        typeof response.data.daily_energy === "number"
      ) {
        setEnergyData(response.data);
      } else {
        console.warn("Invalid API response structure", response.data);
        setEnergyData({ current_power: 0, total_energy: 0, daily_energy: 0 });
      }
    } catch (error) {
      console.error("API Fetch Error:", error);
      Alert.alert("Error", "Failed to fetch energy readings.");
      setEnergyData({ current_power: 0, total_energy: 0, daily_energy: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlugState = async () => {
    try {
      const response = await axios.get(`${API_BASE}/status`);
      setPlugState(response.data.plug_state);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch plug state.");
    }
  };

  const togglePlug = async () => {
    setLoading(true);
    try {
      const action = plugState ? "off" : "on";
      console.log("Toggling Plug:", action);
  
      const response = await axios.post(`${API_BASE}/toggle`, { action });
      console.log("Toggle Response:", response.data);
  
      setPlugState(response.data.plug_state);
    } catch (error: any) {
      console.error("Toggle API Error:", error.response ? error.response.data : error);
      Alert.alert("Error", `Failed to toggle plug state. ${error.response ? error.response.data.error : ""}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugState();
    fetchEnergyData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Energy Tracking</Text>
      <View style={styles.content}>
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Current Power</Text>
          <Text style={styles.boxValue}>
            {energyData.current_power.toFixed(2)} W
          </Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Total Energy</Text>
          <Text style={styles.boxValue}>
            {energyData.total_energy.toFixed(3)} kWh
          </Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Daily Energy</Text>
          <Text style={styles.boxValue}>
            {energyData.daily_energy.toFixed(3)} kWh
          </Text>
        </View>
      </View>
      <Button title={plugState ? "Turn Off" : "Turn On"} onPress={togglePlug} />
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