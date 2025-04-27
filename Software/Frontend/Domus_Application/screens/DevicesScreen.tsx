import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Image,
  RefreshControl,
  ScrollView,
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
  const backendDevicesUrl = "http://domus-central.local:5000/devices";

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

  // Helper: Save active devices to local storage
  const saveActiveDevices = async (devices: Device[]) => {
    try {
      await AsyncStorage.setItem("activeDevices", JSON.stringify(devices));
    } catch (err) {
      console.error("Failed to save active devices:", err);
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

  // Fetch available devices from backend and update active and paired devices
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

      // Save all active devices to AsyncStorage
      saveActiveDevices(allDevices);

      // Merge new devices into the pairedDevices list without removing offline ones.
      const pairedIds = pairedDevices.map((d) => d.device_id);
      const newPaired = allDevices.filter((d) => !pairedIds.includes(d.device_id));
      const updatedPaired = [...pairedDevices, ...newPaired];

      // Update available devices as those not paired (from current fetch)
      const available = allDevices.filter((d) => !updatedPaired.some((p) => p.device_id === d.device_id));

      setAvailableDevices(available);
      setPairedDevices(updatedPaired);
      savePairedDevices(updatedPaired);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Friendly name: support both TempSensor and MotionSensor
  const getFriendlyName = (device_id: string) => {
    const id = device_id.toLowerCase();
    if (id === "domus-motionsensor") return "Domus MotionSensor";
    if (id === "domus-tempsensor" || id.includes("bme688") || id.includes("domus")) return "Domus TempSensor";
    return device_id;
  };

  // Load paired devices then fetch available devices on mount
  useEffect(() => {
    loadPairedDevices().then(fetchDevices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Render a single device in a card
  const renderDeviceCard = (device: Device, isPaired: boolean) => (
    <View style={styles.deviceCard} key={device.device_id}>
      <View style={styles.deviceInfo}>
        <View style={styles.iconContainer}>
          <Image source={require("../assets/env_icon.png")} style={styles.icon} />
        </View>
        <View style={styles.deviceTextContainer}>
          <Text style={styles.deviceText}>{getFriendlyName(device.device_id)}</Text>
          <Text style={styles.deviceSubText}>{device.ip}</Text>
        </View>
      </View>
      {!isPaired && (
        <TouchableOpacity style={styles.addButton} onPress={() => handlePairDevice(device)}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchDevices} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Paired Devices Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Paired Devices</Text>
          <View style={styles.sectionCard}>
            {pairedDevices.length > 0 ? (
              pairedDevices.map((device) => renderDeviceCard(device, true))
            ) : (
              <Text style={styles.noDevicesText}>No paired devices</Text>
            )}
          </View>
        </View>

        {/* Available Devices Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Available Devices</Text>
          <View style={styles.sectionCard}>
            {availableDevices.length > 0 ? (
              availableDevices.map((device) => renderDeviceCard(device, false))
            ) : (
              <Text style={styles.noDevicesText}>No devices found</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Plus Button for Setup */}
      <TouchableOpacity style={styles.floatingButton} onPress={openInstructionsModal}>
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>

      {/* Instructions Modal */}
      <Modal animationType="slide" transparent={true} visible={instructionsModalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configure New Device</Text>
            <View style={styles.stepsCard}>
              <Text style={styles.step}>1. Connect to the new device’s Wi-Fi network.</Text>
              <Text style={styles.step}>2. Enter your Wi-Fi credentials.</Text>
              <Text style={styles.step}>3. Pair with the new device.</Text>
            </View>
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
  // Overall screen background
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    paddingBottom: 100, // Extra space for the bottom nav bar
  },
  // Section containers
  sectionContainer: {
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 8,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // Shadow for Android
    elevation: 2,
  },
  // Section headers (e.g. "Paired Devices", "Available Devices")
  sectionHeader: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 16,
    marginHorizontal: 24,
    color: "#000000",
  },
  // No devices text
  noDevicesText: {
    fontSize: 18,
    color: "#777777",
    textAlign: "center",
    padding: 20,
  },
  // Individual device row
  deviceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  // Device icon + info container
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    width: 36,
    height: 36,
  },
  deviceTextContainer: {
    justifyContent: "center",
    flex: 1,
  },
  deviceText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  deviceSubText: {
    fontSize: 16,
    color: "#777777",
  },
  // "Add" button to pair a device
  addButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  // Floating + button
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#888", // Using the blue color from original DevicesScreen
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingButtonText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  // Modal styling
  modalContainer: {
    flex: 1,
    justifyContent: "center", 
    alignItems: "center",     
    backgroundColor: "rgba(0, 0, 0, 0.5)", 
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#000",
    textAlign: "center",
  },
  
  stepsCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: "100%",
  },
  
  step: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
    lineHeight: 22,
  },
  
  configButton: {
    backgroundColor: "#FFA500",
    paddingVertical: 12,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  
  configButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  
  cancelButton: {
    backgroundColor: "#eee",
    paddingVertical: 12,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },  
  // Config WebView header
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