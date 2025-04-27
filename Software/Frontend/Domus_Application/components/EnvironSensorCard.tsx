import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Svg, { Path, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";
import Feather from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface EnvironSensorCardProps {
  lastRefresh?: number;
}

export default function EnvironSensorCard({ lastRefresh }: EnvironSensorCardProps) {
  const [sensorData, setSensorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSensorData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem("environSensorData");
      if (cachedData && !sensorData) {
        setSensorData(JSON.parse(cachedData));
      }

      const response = await fetch("http://domus-central.local:5000/bme688-latest");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      setSensorData(data);
      await AsyncStorage.setItem("environSensorData", JSON.stringify(data));
    } catch (error) {
      console.warn("Error fetching sensor data, using cached data if available.", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 10000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  if (loading) {
    return (
      <View style={[styles.card, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const aqiValue = sensorData ? sensorData.gas_resistance : 0;
  const temperature = sensorData ? sensorData.temperature : 0;
  const humidity = sensorData ? sensorData.humidity : 0;
  const pressure = sensorData ? sensorData.pressure : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>EnvironSensor</Text>

      <View style={styles.contentContainer}>
        <View style={styles.gaugeContainer}>
          <AQIMeter aqi={aqiValue} />
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Feather name="thermometer" size={16} color="#3498db" style={styles.metricIcon} />
            <Text style={styles.metricValue}>{temperature}°C</Text>
          </View>
          <View style={styles.metricItem}>
            <Feather name="droplet" size={16} color="#3498db" style={styles.metricIcon} />
            <Text style={styles.metricValue}>{humidity}%</Text>
          </View>
          <View style={styles.metricItem}>
            <Feather name="cloud" size={16} color="#3498db" style={styles.metricIcon} />
            <Text style={styles.metricValue}>{pressure} hPa</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function AQIMeter({ aqi }: { aqi: number }) {
  const aqiRanges = [
    { min: 0, max: 50, quality: "Good", color: "#66bb6a" },
    { min: 51, max: 100, quality: "Moderate", color: "#ffca28" },
    { min: 101, max: 150, quality: "Poor", color: "#ff9800" },
    { min: 151, max: 200, quality: "Very Poor", color: "#f44336" },
    { min: 201, max: 500, quality: "Hazardous", color: "#880e4f" },
  ];

  const currentRange =
    aqiRanges.find((range) => aqi >= range.min && aqi <= range.max) ||
    aqiRanges[aqiRanges.length - 1];
  const quality = currentRange.quality;

  const maxAQI = 300;
  const percentage = Math.min(aqi / maxAQI, 1);
  const startAngle = -120;
  const maxAngle = 120;
  const totalArcAngle = 240;
  const arcFillAngle = percentage * totalArcAngle;
  const centerX = 70;
  const centerY = 70;
  const radius = 60;

  const toRadians = (angle: number) => (angle * Math.PI) / 180;
  const getCoordinates = (angle: number) => {
    const radians = toRadians(angle - 90);
    return {
      x: centerX + radius * Math.cos(radians),
      y: centerY + radius * Math.sin(radians),
    };
  };

  const bgStart = getCoordinates(startAngle);
  const bgEnd = getCoordinates(maxAngle);
  const valueEnd = getCoordinates(startAngle + arcFillAngle);

  const bgPath = `
    M ${bgStart.x} ${bgStart.y}
    A ${radius} ${radius} 0 ${totalArcAngle > 180 ? 1 : 0} 1 ${bgEnd.x} ${bgEnd.y}
  `;
  const valuePath = `
    M ${bgStart.x} ${bgStart.y}
    A ${radius} ${radius} 0 ${arcFillAngle > 180 ? 1 : 0} 1 ${valueEnd.x} ${valueEnd.y}
  `;

  const isValidAQI = !isNaN(aqi) && aqi >= 0;

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={140} height={110} viewBox="0 0 140 110">
        <Defs>
          <LinearGradient id="aqiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#4CC3F7" />
            <Stop offset="50%" stopColor="#81E4C3" />
            <Stop offset="100%" stopColor="#FFA726" />
          </LinearGradient>
        </Defs>

        {/* Background arc */}
        <Path
          d={bgPath}
          stroke="#F5F5F5"
          strokeWidth={20}
          fill="none"
          strokeLinecap="round"
        />

        {/* Value arc */}
        {isValidAQI && (
          <Path
            d={valuePath}
            stroke="url(#aqiGradient)"
            strokeWidth={20}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* AQI label */}
        <SvgText 
          x={centerX} 
          y={centerY - 14} 
          fontSize={14} 
          fill="#999" 
          textAnchor="middle"
        >
          AQI
        </SvgText>

        {/* Value display */}
        <SvgText 
          x={centerX} 
          y={centerY + 20} 
          fontSize={32} 
          fontWeight="600" 
          fill="#2D3748" 
          textAnchor="middle"
        >
          {Math.round(aqi)}
        </SvgText>

        {/* Quality text */}
        <SvgText 
          x={centerX} 
          y={centerY + 38} 
          fontSize={16} 
          fill="#718096" 
          textAnchor="middle"
        >
          {quality}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
    width: "100%",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    marginLeft: 4,
  },
  contentContainer: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
  gaugeContainer: {
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 5,
  },
  metricItem: {
    backgroundColor: "#f5f7fa",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 3,
  },
  metricIcon: {
    marginRight: 4,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
});
