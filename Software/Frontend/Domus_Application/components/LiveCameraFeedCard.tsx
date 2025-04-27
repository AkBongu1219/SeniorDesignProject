import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import { WebView } from "react-native-webview";

const screenWidth = Dimensions.get("window").width;

// Replace this URL with your Pi 4's IP address and port where the MJPEG stream is served.
const STREAM_URL = "http://domus-streamer.local:5000/video_feed";

/**
 * LiveCameraFeedCard
 * ------------------
 * Responsive card showing a "LIVE" label, a live camera feed image from the stream,
 * and one icon button for snapshot action.
 */
export default function LiveCameraFeedCard() {
  const handleSnapshotPress = () => {
    Alert.alert("Snapshot Captured", "Your snapshot has been saved.");
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {/* "LIVE" Tag */}
        <View style={styles.liveTag}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Live camera feed displayed via WebView */}
        <WebView
          source={{ uri: STREAM_URL }}
          style={[styles.cameraImage, { flex: 1 }]}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />

        {/* Snapshot Button */}
        <TouchableOpacity
          style={[styles.iconButton, styles.snapshotButton]}
          onPress={handleSnapshotPress}
        >
          <Feather name="camera" size={20} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1.0,
    position: "relative",
  },
  cameraImage: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  liveTag: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#FF3B30",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  liveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  iconButton: {
    position: "absolute",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  snapshotButton: {
    bottom: 10,
    left: 10,
  },
});