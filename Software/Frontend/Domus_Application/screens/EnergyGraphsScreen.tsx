"use client";

import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  RefreshControl,
} from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import "react-native-svg";
import EnergyTrackingSection from "./EnergyTrackingSection";

// Base URL for the API
const API_BASE_URL = "http://domus-central.local:5050";

const EnergyGraphsScreen = () => {
  // State variables for different data types
  const [powerData, setPowerData] = useState({
    timestamps: [],
    values: [],
    currentValue: 0
  });
  const [hourlyEnergyData, setHourlyEnergyData] = useState({
    hours: [],
    values: []
  });
  const [dailyEnergyData, setDailyEnergyData] = useState({
    days: [],
    values: []
  });
  const [alertData, setAlertData] = useState({
    isAboveAverage: true, // Set to true by default to show permanently
    todayEnergyKwh: 0,
    rollingAverageKwh: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();

    // Set up interval to refresh data every 30 seconds
    const intervalId = setInterval(fetchAllData, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchCurrentPowerData(),
      fetchHourlyEnergyData(),
      fetchDailyEnergyData(),
      fetchAlertData()
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  // Fetch current power data (last 5 minutes, 30-second intervals)
  const fetchCurrentPowerData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/energy/current_power`);
      if (!response.ok) throw new Error("Failed to fetch power data");
      
      const data = await response.json();
      setPowerData({
        timestamps: data.timestamps,
        values: data.values,
        currentValue: data.current_value
      });
    } catch (error) {
      console.error("Error fetching current power data:", error);
    }
  };

  // Fetch hourly energy data (hour 0-23)
  const fetchHourlyEnergyData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/energy/hourly`);
      if (!response.ok) throw new Error("Failed to fetch hourly data");
      
      const data = await response.json();
      // Convert kWh to mWh for better readability with small values
      const milliWattHourValues = data.values.map(value => value * 1000000);
      
      setHourlyEnergyData({
        hours: data.hours,
        values: milliWattHourValues
      });
    } catch (error) {
      console.error("Error fetching hourly energy data:", error);
    }
  };

  // Fetch daily energy data (Mon-Sun)
  const fetchDailyEnergyData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/energy/daily`);
      if (!response.ok) throw new Error("Failed to fetch daily data");
      
      const data = await response.json();
      // Convert kWh to mWh for better readability with small values
      const milliWattHourValues = data.values.map(value => value * 1000000);
      
      setDailyEnergyData({
        days: data.days,
        values: milliWattHourValues
      });
    } catch (error) {
      console.error("Error fetching daily energy data:", error);
    }
  };

  // Fetch alert data (today's energy vs rolling average)
  const fetchAlertData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/energy/alert`);
      if (!response.ok) throw new Error("Failed to fetch alert data");
      
      const data = await response.json();
      // We'll get the alert data but always keep isAboveAverage as true
      setAlertData({
        isAboveAverage: true, // Force it to always be true
        todayEnergyKwh: data.today_energy_kwh,
        rollingAverageKwh: data.rolling_average_kwh
      });
    } catch (error) {
      console.error("Error fetching alert data:", error);
    }
  };

  // Render current power chart (last 5 minutes)
  const renderPowerChart = () => {
    if (powerData.timestamps.length === 0) return null;

    // Use simpler labels for x-axis (1:00, 2:00, etc.)
    const labels = ["1:00", "2:00", "3:00", "4:00", "5:00"];

    const chartData = {
      labels,
      datasets: [{
        data: powerData.values,
        color: () => "#4E97DB",
        strokeWidth: 2
      }]
    };

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Current Power</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={Dimensions.get("window").width - 64}
            height={220}
            fromZero
            yAxisSuffix=" W"
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 1,
              color: () => "#4E97DB",
              labelColor: () => "#000000",
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#4E97DB"
              },
              propsForLabels: {
                fontSize: 10,
                fontWeight: "500"
              },
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: "rgba(0, 0, 0, 0.05)"
              },
              style: {
                borderRadius: 16,
              },
              propsForVerticalLabels: {
                fontWeight: "500",
                fontSize: 10,
              },
              propsForHorizontalLabels: {
                fontWeight: "500",
                fontSize: 10,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
        <View style={styles.yAxisLabelContainer}>
          <Text style={styles.axisLabel}>Power (W)</Text>
        </View>
        <View style={styles.xAxisLabelContainer}>
          <Text style={styles.axisLabel}>Time (min)</Text>
        </View>
      </View>
    );
  };

  // Render today's hourly energy chart (hour 0-23)
  const renderHourlyEnergyChart = () => {
    if (hourlyEnergyData.hours.length === 0) return null;

    // Format hours to display only some labels to avoid crowding
    const labels = hourlyEnergyData.hours.map((hour, index) => 
      index % 4 === 0 ? hour : ""
    );

    const chartData = {
      labels,
      datasets: [{
        data: hourlyEnergyData.values,
        color: () => "#2471A3",
        strokeWidth: 2
      }]
    };

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Today's Energy</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={Dimensions.get("window").width - 64}
            height={220}
            fromZero={true}
            yAxisSuffix=" mWh"
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: () => "#2471A3",
              labelColor: () => "#000000",
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#2471A3"
              },
              propsForLabels: {
                fontSize: 10,
                fontWeight: "500"
              },
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: "rgba(0, 0, 0, 0.05)"
              },
              style: {
                borderRadius: 16,
              },
              propsForVerticalLabels: {
                fontWeight: "500",
                fontSize: 10,
              },
              propsForHorizontalLabels: {
                fontWeight: "500",
                fontSize: 10,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
        <View style={styles.yAxisLabelContainer}>
          <Text style={styles.axisLabel}>Energy (mWh)</Text>
        </View>
        <View style={styles.xAxisLabelContainer}>
          <Text style={styles.axisLabel}>Hour of Day</Text>
        </View>
      </View>
    );
  };

  // Render weekly energy bar chart (Mon-Sun)
  const renderDailyBarChart = () => {
    if (dailyEnergyData.days.length === 0) return null;

    // Format to shorter day labels
    const labels = dailyEnergyData.days.map(day => day.substring(0, 3));
    
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Daily Energy</Text>
        <View style={styles.chartContainer}>
          <BarChart
            data={{
              labels,
              datasets: [{
                data: dailyEnergyData.values.map(d => parseFloat(d.toFixed(1))),
              }],
            }}
            width={Dimensions.get("window").width - 64}
            height={220}
            fromZero
            yAxisSuffix=" mWh"
            withInnerLines={false}
            showBarTops={false}
            showValuesOnTopOfBars={true}
            withCustomBarColorFromData={false}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: () => "#6E6E6E", // axis + label color
              fillShadowGradient: "#6E6E6E", // solid grey bars
              fillShadowGradientOpacity: 1,
              labelColor: () => "#000000",
              style: {
                borderRadius: 16,
              },
              barPercentage: 0.7, // smaller bars = labels appear higher
              propsForLabels: {
                fontSize: 10,
                fontWeight: "600"
              },
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: "rgba(0, 0, 0, 0.05)"
              },
              propsForVerticalLabels: {
                fontSize: 10,
                fontWeight: "500",
              }
            }}
            style={styles.chart}
          />
        </View>
        <View style={styles.yAxisLabelContainer}>
          <Text style={styles.axisLabel}>Energy (mWh)</Text>
        </View>
        <View style={styles.xAxisLabelContainer}>
          <Text style={styles.axisLabel}>Days</Text>
        </View>
      </View>
    );
  };

  // Create alert message based on energy usage comparison
  const getAlertMessage = () => {
    return "Energy usage is above your average!";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <EnergyTrackingSection 
          powerData={powerData.currentValue} 
          hourlyEnergyData={hourlyEnergyData} 
          refreshing={refreshing}
        />
          
        {/* Anomaly Info Banner - Always shown */}
        <View style={styles.anomalyBanner}>
          <View style={styles.warningIconContainer}>
            <Text style={{ color: "#8B2525", fontSize: 24 }}>⚠️</Text>
          </View>
          <View style={styles.anomalyTextContainer}>
            <Text style={styles.anomalyText}>{getAlertMessage()}</Text>
          </View>
        </View>

        <Text style={styles.screenTitle}>Energy Trends</Text>

        {renderPowerChart()}

        {renderHourlyEnergyChart()}

        {renderDailyBarChart()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  container: {
    padding: 16,
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 20,
  },
  anomalyBanner: {
    backgroundColor: "#FFF2F2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    marginVertical: 8,
    width: Dimensions.get("window").width - 32,
    flexDirection: "row",
    alignItems: "center",
  },
  warningIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(198, 40, 40, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  anomalyTextContainer: {
    flex: 1,
  },
  anomalyText: {
    color: "#8B2525",
    fontWeight: "700",
    fontSize: 18,
    textAlign: "left",
    marginBottom: 4,
  },
  anomalySubtext: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8B2525",
    marginBottom: 0,
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginVertical: 12,
    width: Dimensions.get("window").width - 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    alignItems: "center",
  },
  chartContainer: {
    alignItems: "center",
    marginHorizontal: -8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  axisLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  yAxisLabelContainer: {
    position: "absolute",
    left: -36,
    top: "50%",
    transform: [{ rotate: "-90deg" }, { translateY: -50 }],
    zIndex: 1,
  },
  xAxisLabelContainer: {
    marginTop: 12,
  },
});

export default EnergyGraphsScreen;