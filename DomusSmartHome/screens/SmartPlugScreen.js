import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator } from "react-native";
import axios from "axios";

const API_BASE = "http://10.0.0.4:8080"; // Replace with your backend IP

const SmartPlugScreen = () => {
  const [plugState, setPlugState] = useState(false);
  const [energyData, setEnergyData] = useState({ current_power: 0, total_energy: 0 });
  const [loading, setLoading] = useState(false);

  // Fetch energy readings
  const fetchEnergyData = async () => {
    setLoading(true);
    try {
      console.log("Fetching energy data...");
      const response = await axios.get(`${API_BASE}/energy`);
      console.log("Energy data response:", response.data);
      setEnergyData(response.data);
    } catch (error) {
      console.error("Error fetching energy data:", error.response || error.message);
      Alert.alert("Error", `Failed to fetch energy readings. ${error.response?.data?.error || ""}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch plug state
  const fetchPlugState = async () => {
    setLoading(true);
    try {
      console.log("Fetching plug state...");
      const response = await axios.get(`${API_BASE}/status`);
      console.log("Plug state response:", response.data);
      setPlugState(response.data.plug_state);
    } catch (error) {
      console.error("Error fetching plug state:", error.response || error.message);
      Alert.alert("Error", `Failed to fetch plug state. ${error.response?.data?.error || ""}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle plug state
  const togglePlug = async (action) => {
    setLoading(true);
    try {
      console.log(`Toggling plug to ${action}...`);
      const response = await axios.post(`${API_BASE}/toggle`, { action });
      console.log("Toggle plug response:", response.data);
      setPlugState(response.data.plug_state);
    } catch (error) {
      console.error("Error toggling plug:", error.response || error.message);
      Alert.alert("Error", `Failed to toggle plug state. ${error.response?.data?.error || ""}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugState(); // Fetch the plug's current state on load
    fetchEnergyData(); // Fetch energy data on load
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Plug Control</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Button
            title={plugState ? "Turn Off" : "Turn On"}
            onPress={() => togglePlug(plugState ? "off" : "on")}
          />
          <Text style={styles.energy}>
            Current Power: {energyData?.current_power?.toFixed(2) ?? "0"} W
          </Text>
          <Text style={styles.energy}>
            Total Energy: {energyData?.total_energy?.toFixed(3) ?? "0"} kWh
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  energy: {
    fontSize: 18,
    marginVertical: 10,
  },
});

export default SmartPlugScreen;
