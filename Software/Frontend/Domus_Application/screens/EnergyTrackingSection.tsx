import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import axios from "axios";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const API_BASE = "http://domus-central.local:5050"; // Flask API endpoint

interface EnergyTrackingSectionProps {
  powerData: number;
  hourlyEnergyData: {
    hours: string[];
    values: number[];
  };
  refreshing: boolean;
}

const EnergyTrackingSection: React.FC<EnergyTrackingSectionProps> = ({ 
  powerData, 
  hourlyEnergyData,
  refreshing
}) => {
  const [plugState, setPlugState] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get the latest hourly energy data point (today's energy)
  const getLatestHourlyEnergy = (): number => {
    if (hourlyEnergyData.values.length === 0) return 0;
    
    // Find the last non-zero value, or use the last value if all are zero
    const nonZeroValues = hourlyEnergyData.values.filter(val => val > 0);
    if (nonZeroValues.length > 0) {
      return nonZeroValues[nonZeroValues.length - 1]; // Already in mWh from parent
    }
    return hourlyEnergyData.values[hourlyEnergyData.values.length - 1];
  };

  // Get the last hour's energy
  const getLastHourEnergy = (): number => {
    if (hourlyEnergyData.hours.length === 0 || hourlyEnergyData.values.length === 0) return 0;
    
    // Get the current hour
    const date = new Date();
    const currentHour = date.getHours();
    
    // Find the index for the current hour
    const hourIndex = hourlyEnergyData.hours.findIndex(hour => parseInt(hour) === currentHour);
    
    // If found, return the previous hour's energy, otherwise the last available
    if (hourIndex > 0) {
      return hourlyEnergyData.values[hourIndex - 1]; // Already in mWh from parent
    } else if (hourIndex === 0 && hourlyEnergyData.values.length > 1) {
      // If current hour is first in the array, return the last hour from yesterday
      return hourlyEnergyData.values[hourlyEnergyData.values.length - 1];
    }
    
    return 0;
  };

  const fetchPlugState = async () => {
    try {
      const response = await axios.get(`${API_BASE}/status`);
      setPlugState(response.data.plug_state);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch plug state.");
    } finally {
      setLoading(false);
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
  }, []);

  useEffect(() => {
    // When refreshing ends, make sure we're not in loading state
    if (!refreshing) {
      setLoading(false);
    }
  }, [refreshing]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Energy Usage</Text>
      
      <View style={styles.metricsContainer}>
        <View style={styles.metricBox}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="lightning-bolt" size={18} color="#666" />
          </View>
          <Text style={styles.metricLabel}>Power</Text>
          <Text style={styles.metricValue}>{powerData.toFixed(2)} W</Text>
        </View>

        <View style={styles.metricBox}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="chart-bar" size={18} color="#666" />
          </View>
          <Text style={styles.metricLabel}>Energy</Text>
          <Text style={styles.metricValue}>{getLatestHourlyEnergy().toFixed(1)} mWh</Text>
        </View>

        <View style={styles.metricBox}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#666" />
          </View>
          <Text style={styles.metricLabel}>Live</Text>
          <Text style={styles.metricValue}>{getLastHourEnergy().toFixed(1)} mWh</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.toggleButton} onPress={togglePlug} activeOpacity={0.8}>
        <View style={[styles.toggle, plugState && styles.toggleActive]}>
          <View style={[styles.toggleKnob, plugState && styles.toggleKnobActive]} />
        </View>
        <Text style={styles.toggleText}>{plugState ? "On" : "Off"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    width: "100%",
    alignItems: "center",
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
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  metricBox: {
    flex: 1,
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F4FF",
    padding: 12,
    borderRadius: 16,
  },
  toggle: {
    width: 48,
    height: 28,
    backgroundColor: "#E0E0E0",
    borderRadius: 14,
    padding: 3,
    marginRight: 10,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#4CAF50",
  },
  toggleKnob: {
    width: 20,
    height: 20,
    backgroundColor: "#FFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  toggleText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default EnergyTrackingSection;