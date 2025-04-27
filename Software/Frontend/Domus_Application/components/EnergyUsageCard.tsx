import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://domus-central.local:5050"; // Smart Plug Backend
const mockMode = false; // Set to true for testing UI without the smart plug

interface EnergyUsageCardProps {
  lastRefresh?: number;
}

const EnergyUsageCard = ({ lastRefresh }: EnergyUsageCardProps) => {
  const [powerData, setPowerData] = useState<number>(0);
  const [hourlyEnergyData, setHourlyEnergyData] = useState<{
    hours: string[];
    values: number[];
  }>({
    hours: [],
    values: [],
  });
  const [plugState, setPlugState] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to fetch energy data
  const fetchEnergyData = async () => {
    if (mockMode) {
      // Use mock data for testing
      const mockPowerData = 42.75;
      const mockHourlyData = {
        hours: ["10", "11", "12", "13"],
        values: [120.5, 89.2, 145.7, 78.3],
      };
      setPowerData(mockPowerData);
      setHourlyEnergyData(mockHourlyData);
      await AsyncStorage.setItem("powerData", JSON.stringify(mockPowerData));
      await AsyncStorage.setItem("hourlyEnergyData", JSON.stringify(mockHourlyData));
    } else {
      try {
        // Fetch current power
        const powerResponse = await axios.get(`${API_BASE}/energy/current_power`);
        if (powerResponse.data && typeof powerResponse.data.current_value === "number") {
          setPowerData(powerResponse.data.current_value);
          await AsyncStorage.setItem("powerData", JSON.stringify(powerResponse.data.current_value));
        }
        
        // Fetch hourly energy data
        const hourlyResponse = await axios.get(`${API_BASE}/energy/hourly`);
        if (hourlyResponse.data && 
            Array.isArray(hourlyResponse.data.hours) && 
            Array.isArray(hourlyResponse.data.values)) {
          
          // Convert kWh to mWh for better readability with small values
          const milliWattHourValues = hourlyResponse.data.values.map(value => value * 1000000);
          
          const hourlyData = {
            hours: hourlyResponse.data.hours,
            values: milliWattHourValues
          };
          
          setHourlyEnergyData(hourlyData);
          await AsyncStorage.setItem("hourlyEnergyData", JSON.stringify(hourlyData));
        }
      } catch (error) {
        console.error("API Fetch Error:", error);
        setPowerData(0);
        setHourlyEnergyData({ hours: [], values: [] });
      }
    }
  };

  // Function to fetch plug state
  const fetchPlugState = async () => {
    if (mockMode) {
      // Use mock plug state for testing
      setPlugState(true);
      await AsyncStorage.setItem("plugState", JSON.stringify(true));
    } else {
      try {
        const response = await axios.get(`${API_BASE}/status`);
        setPlugState(response.data.plug_state);
        await AsyncStorage.setItem("plugState", JSON.stringify(response.data.plug_state));
      } catch (error) {
        console.error("Error fetching plug state:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Function to toggle plug state
  const togglePlug = async () => {
    if (mockMode) {
      // Simply toggle the state in mock mode
      const newState = !plugState;
      setPlugState(newState);
      await AsyncStorage.setItem("plugState", JSON.stringify(newState));
    } else {
      try {
        setLoading(true);
        const action = plugState ? "off" : "on";
        const response = await axios.post(`${API_BASE}/toggle`, { action });
        setPlugState(response.data.plug_state);
        await AsyncStorage.setItem("plugState", JSON.stringify(response.data.plug_state));
      } catch (error: any) {
        console.error("Toggle API Error:", error.response ? error.response.data : error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Get the latest hourly energy data point (today's energy)
  const getLatestHourlyEnergy = (): number => {
    if (hourlyEnergyData.values.length === 0) return 0;
    
    // Find the last non-zero value, or use the last value if all are zero
    const nonZeroValues = hourlyEnergyData.values.filter(val => val > 0);
    if (nonZeroValues.length > 0) {
      return nonZeroValues[nonZeroValues.length - 1];
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
      return hourlyEnergyData.values[hourIndex - 1];
    } else if (hourIndex === 0 && hourlyEnergyData.values.length > 1) {
      // If current hour is first in the array, return the last hour from yesterday
      return hourlyEnergyData.values[hourlyEnergyData.values.length - 1];
    }
    
    return 0;
  };

  // Load cached data and then fetch fresh data
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedPower = await AsyncStorage.getItem("powerData");
        const cachedHourly = await AsyncStorage.getItem("hourlyEnergyData");
        const cachedPlug = await AsyncStorage.getItem("plugState");
        
        if (cachedPower) {
          setPowerData(JSON.parse(cachedPower));
        }
        if (cachedHourly) {
          setHourlyEnergyData(JSON.parse(cachedHourly));
        }
        if (cachedPlug) {
          setPlugState(JSON.parse(cachedPlug));
        }
      } catch (error) {
        console.error("Error loading cached data:", error);
      }
    };

    loadCachedData();
    fetchEnergyData();
    fetchPlugState();
  }, [lastRefresh]);

  // Effect to update loading state when lastRefresh changes
  useEffect(() => {
    if (!lastRefresh) {
      setLoading(false);
    }
  }, [lastRefresh]);

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

      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={togglePlug}
        activeOpacity={0.8}
      >
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#F0F4FF', // Light blue shade
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4FF',
    padding: 12,
    borderRadius: 16,
  },
  toggle: {
    width: 48,
    height: 28,
    backgroundColor: '#E0E0E0',
    borderRadius: 14,
    padding: 3,
    marginRight: 10,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#4CAF50',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    backgroundColor: '#FFF',
    borderRadius: 10,
    shadowColor: '#000',
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
    color: '#333',
    fontWeight: '600',
  },
});

export default EnergyUsageCard;