import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Feather from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * RecentActivityCard
 * ------------------
 * Displays the last motion detection time and the currently visible objects.
 * The UI is unchanged; mock data is replaced by actual data fetched from the backend.
 */
export default function RecentActivityCard() {
  const [lastMotion, setLastMotion] = useState<string | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<
    { label: string; confidence: number; timestamp: string }[]
  >([]);

  const MOTION_API = "http://domus-central.local:5000";
  const DETECTIONS_API = "http://domus-central.local:8080";

  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedMotion = await AsyncStorage.getItem("lastMotion");
        const cachedDetections = await AsyncStorage.getItem("detectedObjects");

        if (cachedMotion) {
          setLastMotion(cachedMotion);
        }

        if (cachedDetections) {
          const parsed = JSON.parse(cachedDetections);
          if (Array.isArray(parsed)) {
            setDetectedObjects(parsed);
          }
        }
      } catch (error) {
        console.error("Error loading cached activity data:", error);
      }
    };

    const fetchMotionData = async () => {
      try {
        const response = await fetch(`${MOTION_API}/motion-latest`);
        const data = await response.json();
        if (data.timestamp) {
          setLastMotion(data.timestamp);
          AsyncStorage.setItem("lastMotion", data.timestamp);
        } else {
          setLastMotion(null);
        }
      } catch (error) {
        console.error("Error fetching motion data:", error);
      }
    };

    const fetchDetections = async () => {
      try {
        const response = await fetch(`${DETECTIONS_API}/latest_detections`);
        const data = await response.json();
        if (data.detections) {
          setDetectedObjects(data.detections);
          AsyncStorage.setItem("detectedObjects", JSON.stringify(data.detections));
        } else {
          setDetectedObjects([]);
        }
      } catch (error) {
        console.error("Error fetching detections:", error);
      }
    };

    loadCachedData();
    fetchMotionData();
    fetchDetections();
  }, []);

  const formatTimeSince = (timestamp: string | null) => {
    if (!timestamp) return null;

    const motionDate = new Date(timestamp.replace(" ", "T"));
    const now = new Date();
    const diffMs = now.getTime() - motionDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60)
      return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    if (diffMinutes < 1440) {
      const minutes = diffMinutes % 60;
      return `${diffHours} hour${diffHours === 1 ? "" : "s"}${
        minutes ? ` ${minutes}m` : ""
      } ago`;
    }

    return motionDate.toLocaleString(); // fallback: exact date/time
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Recent Activity</Text>

      <View style={styles.row}>
        <Feather name="activity" size={18} color="#333" style={styles.icon} />
        <Text style={styles.text}>
          Last Motion Detected:{" "}
          <Text style={styles.bold}>
            {lastMotion ? formatTimeSince(lastMotion) : "No data"}
          </Text>
        </Text>
      </View>

      <View style={[styles.row, { marginTop: 10 }]}>
        <Feather name="eye" size={18} color="#333" style={styles.icon} />
        <Text style={styles.text}>Objects in camera's view:</Text>
      </View>

      <View style={styles.objectList}>
        {detectedObjects.length > 0 ? (
          detectedObjects.map((obj, index) => (
            <Text key={index} style={styles.objectText}>
              • {obj.label} ({obj.confidence}%)
            </Text>
          ))
        ) : (
          <Text style={styles.objectText}>No detections</Text>
        )}
      </View>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    color: "#444",
  },
  bold: {
    fontWeight: "600",
    color: "#000",
  },
  objectList: {
    marginTop: 8,
    paddingLeft: 26,
  },
  objectText: {
    fontSize: 16,
    color: "#444",
    marginBottom: 4,
  },
});