"use client";

import { useState, useEffect } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import "react-native-svg"; // Required for charts to work

interface EnergyData {
  timestamp: string;
  current_power_watts: number;
  total_energy_kwh: number;
  daily_energy_kwh: number;
}

const API_URL = "http://192.168.1.163:8080/download_csv";

const EnergyGraphsScreen = () => {
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);

  useEffect(() => {
    fetchEnergyData();
  }, []);

  const fetchEnergyData = async () => {
    try {
      const response = await fetch(API_URL);
      const csvText = await response.text();
      console.log("CSV Response:", csvText); // Debugging

      const parsedData = parseCSV(csvText);
      console.log("Parsed Energy Data:", parsedData); // Debugging

      setEnergyData(parsedData);
    } catch (error) {
      console.error("Error fetching energy data:", error);
    }
  };

  const parseCSV = (csvText: string): EnergyData[] => {
    const lines = csvText.split("\n");
    const data: EnergyData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const [timestamp, current_power_watts, total_energy_kwh, daily_energy_kwh] = line.split(",");

        if (!timestamp || isNaN(Number(current_power_watts))) {
          console.warn("Skipping invalid row:", line);
          continue;
        }

        data.push({
          timestamp,
          current_power_watts: Number.parseFloat(current_power_watts),
          total_energy_kwh: Number.parseFloat(total_energy_kwh),
          daily_energy_kwh: Number.parseFloat(daily_energy_kwh),
        });
      }
    }
    return data;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      console.warn("Invalid timestamp:", timestamp);
      return "";
    }
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  // Function to filter X-axis labels for better readability
  const filterTimestamps = (timestamps: string[]) => {
    const totalLabels = 6; // Show only 6 timestamps evenly spaced
    const step = Math.max(1, Math.floor(timestamps.length / totalLabels));

    return timestamps.map((t, index) => (index % step === 0 ? t : ""));
  };

  const renderChart = (title: string, data: number[], color: string) => {
    if (data.length === 0) return null; // Prevent empty charts
  
    const timestamps = energyData.slice(-24).map((d) => formatTimestamp(d.timestamp));
    const filteredLabels = filterTimestamps(timestamps);
  
    // Determine max and min Y-axis values and apply buffer
    const maxYValue = Math.max(...data) * 1.2; // Add 20% buffer for better visibility
    const adjustedData = data.map((value) => (value === maxYValue ? value * 0.95 : value)); // Prevents exact max cutoff
  
    const chartData = {
      labels: filteredLabels,
      datasets: [{ data: adjustedData }],
    };
  
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get("window").width - 32}
          height={220}
          yAxisInterval={1} // Ensures proper scaling
          fromZero={true} // Ensures Y-axis starts from zero
          yAxisSuffix="" // Empty to allow clean numerical representation
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            propsForDots: {
              r: "5",
              strokeWidth: "2",
              stroke: color,
            },
            propsForLabels: {
              fontSize: 12, // Keep labels readable
              rotation: 45, // Rotate for better readability
            },
            propsForHorizontalLabels: {
              fontSize: 10,
            },
            propsForVerticalLabels: {
              fontSize: 12,
            },
            propsForBackgroundLines: {
              strokeDasharray: "3 3", // Dashed grid lines for a subtle look
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
            marginTop: 10, // Prevents Y-axis labels from being cut off
          }}
        />
      </View>
    );
  };

  if (energyData.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Energy Graphs</Text>
        <Text style={{ textAlign: "center", marginTop: 20 }}>No data available. Fetching...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>Energy Graphs</Text>
        {renderChart(
          "Current Power (Watts)",
          energyData.slice(-24).map((d) => d.current_power_watts),
          "#FF6384"
        )}
        {renderChart(
          "Total Energy (kWh)",
          energyData.slice(-24).map((d) => d.total_energy_kwh),
          "#36A2EB"
        )}
        {renderChart(
          "Daily Energy (kWh)",
          energyData.slice(-24).map((d) => d.daily_energy_kwh),
          "#FFCE56"
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffebcd",
  },
  scrollView: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    alignSelf: "center",
  },
  chartContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
});

export default EnergyGraphsScreen;