import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  SafeAreaView,
  Modal,
  Image,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";

// Device type as returned by backend
interface Device {
  device_id: string;
  ip: string;
  lastSeen: number;
}

const DevicesScreen = () => {
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [pairedDevices, setPairedDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [instructionsModalVisible, setInstructionsModalVisible] = useState<boolean>(false);
  const [configModalVisible, setConfigModalVisible] = useState<boolean>(false);

  // URL to fetch available devices from your unified backend
  const backendDevicesUrl = "http://192.168.1.152:5000/devices";

  // Helper: Load locally stored paired devices
  const loadPairedDevices = async () => {
    try {
      const stored = await AsyncStorage.getItem("pairedDevices");
      if (stored) {
        setPairedDevices(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load paired devices:", err);
    }
  };

  // Helper: Save paired devices to local storage
  const savePairedDevices = async (devices: Device[]) => {
    try {
      await AsyncStorage.setItem("pairedDevices", JSON.stringify(devices));
    } catch (err) {
      console.error("Failed to save paired devices:", err);
    }
  };

  // When user taps "Add" next to an available device, add it to paired list
  const handlePairDevice = (device: Device) => {
    const updatedPaired = [...pairedDevices, device];
    const filteredAvailable = availableDevices.filter((d) => d.device_id !== device.device_id);
    setPairedDevices(updatedPaired);
    setAvailableDevices(filteredAvailable);
    savePairedDevices(updatedPaired);
  };

  // Fetch available devices from backend and split into paired vs available
  const fetchDevices = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(backendDevicesUrl);
      if (!response.ok) throw new Error("Error fetching devices");
      const data = await response.json();
      // Data is expected as an object with keys as device_id
      const allDevices: Device[] = Object.keys(data).map((device_id) => ({
        device_id,
        ...data[device_id],
      }));

      // Compare with our locally paired devices (by device_id)
      const pairedIds = pairedDevices.map((d) => d.device_id);
      const available = allDevices.filter((d) => !pairedIds.includes(d.device_id));
      const stillPaired = pairedDevices.filter((d) =>
        allDevices.some((live) => live.device_id === d.device_id)
      );

      setAvailableDevices(available);
      setPairedDevices(stillPaired); // update paired list to only include live ones
      savePairedDevices(stillPaired);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Friendly name: if device_id includes "Domus" (case-insensitive), show "Domus TempSensor"
  const getFriendlyName = (device_id: string) => {
    if (device_id.toLowerCase().includes("domus")) {
      return "Domus TempSensor";
    }
    return device_id;
  };

  // Load paired devices then fetch available devices on mount
  useEffect(() => {
    loadPairedDevices().then(fetchDevices);
  }, []);

  // Prepare section data for the SectionList
  const sections = [
    { title: "Paired Devices", data: pairedDevices },
    { title: "Available Devices", data: availableDevices },
  ];

  // Handlers for modal display (setup flow)
  const openInstructionsModal = () => {
    setInstructionsModalVisible(true);
  };

  const openDeviceConfig = () => {
    setInstructionsModalVisible(false);
    setConfigModalVisible(true);
  };

  const closeConfigModal = () => {
    setConfigModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.device_id}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item, section }) => (
          <View style={styles.deviceCard}>
            <View style={styles.deviceInfo}>
              <Image source={require("../assets/env_icon.png")} style={styles.icon} />
              <View style={styles.deviceTextContainer}>
                <Text style={styles.deviceText}>{getFriendlyName(item.device_id)}</Text>
                <Text style={styles.deviceSubText}>{item.ip}</Text>
              </View>
            </View>
            {section.title === "Available Devices" && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handlePairDevice(item)}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchDevices} />
        }
        ListEmptyComponent={
          <Text style={styles.infoText}>No devices found. Pull down to refresh.</Text>
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Floating Plus Button for Setup (e.g., if user needs to send WiFi credentials) */}
      <TouchableOpacity style={styles.floatingButton} onPress={openInstructionsModal}>
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>

      {/* Instructions Modal */}
      <Modal animationType="slide" transparent={true} visible={instructionsModalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configure New Device</Text>
            <Text style={styles.instructions}>
              To add a new device, please switch your Wi-Fi to the "Domus-TempSensor" network (the ESP32 device) using your device settings.
            </Text>
            <TouchableOpacity style={styles.configButton} onPress={openDeviceConfig}>
              <Text style={styles.configButtonText}>Open Setup Page</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setInstructionsModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Configuration Modal with WebView */}
      <Modal animationType="slide" transparent={false} visible={configModalVisible}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.configHeader}>
            <TouchableOpacity onPress={closeConfigModal}>
              <Text style={styles.closeConfigText}>Close</Text>
            </TouchableOpacity>
          </View>
          <WebView source={{ uri: "http://192.168.4.1" }} style={{ flex: 1 }} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f6f6" },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
    marginLeft: 10,
    color: "#333",
  },
  infoText: { fontSize: 16, color: "#777", textAlign: "center", marginTop: 20 },
  deviceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#fff",
    marginHorizontal: 10,
    borderRadius: 6,
    marginBottom: 5,
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  deviceTextContainer: {
    justifyContent: "center",
  },
  deviceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  deviceSubText: {
    fontSize: 14,
    color: "#777",
  },
  addButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#007BFF",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  floatingButtonText: { color: "#fff", fontSize: 36, fontWeight: "bold" },
  modalContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%", backgroundColor: "#fff",
    padding: 20, borderRadius: 10, alignItems: "center",
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  instructions: { fontSize: 16, textAlign: "center", marginBottom: 15 },
  configButton: { backgroundColor: "#FFA500", padding: 10, borderRadius: 8, marginBottom: 10 },
  configButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  cancelButton: { backgroundColor: "#ccc", padding: 12, borderRadius: 8, marginTop: 10 },
  cancelButtonText: { color: "#333", fontSize: 16, fontWeight: "bold" },
  configHeader: {
    backgroundColor: "#f6f6f6",
    padding: 10,
    alignItems: "flex-end",
  },
  closeConfigText: {
    fontSize: 16,
    color: "#007BFF",
    fontWeight: "bold",
  },
});

export default DevicesScreen;