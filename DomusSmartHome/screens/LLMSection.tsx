import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet, Button, Text, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from "react-native";
import io from "socket.io-client";
import axios from "axios";

// API URLs
const SOCKET_SERVER_URL = "http://localhost:5001"; // LLM WebSocket server
const BME688_API_URL = "http://172.20.10.2:5000/bme688-latest"; 
const MOTION_API_URL = "http://172.20.10.2:5000/motion-latest";
const ENERGY_API_URL = "http://10.0.0.25:8080/energy"; // Smart plug energy data API

const LLMSection = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [socket, setSocket] = useState<any>(null);
  const [sensorData, setSensorData] = useState({
    temperature: "--",
    humidity: "--",
    pressure: "--",
    gasResistance: "--",
    motion: "--",
    energy: "--",
  });

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchSensorData = async () => {
    try {
      const responseBME = await axios.get(BME688_API_URL);
      const responseMotion = await axios.get(MOTION_API_URL);
      setSensorData((prev) => ({
        ...prev,
        temperature: responseBME.data.temperature,
        humidity: responseBME.data.humidity,
        pressure: responseBME.data.pressure,
        gasResistance: responseBME.data.gas_resistance,
        motion: responseMotion.data.motion,
      }));
    } catch (error) {
      Alert.alert("Error", "Failed to fetch sensor data.");
    }
  };

  const fetchEnergyData = async () => {
    try {
      const response = await axios.get(ENERGY_API_URL);
      setSensorData((prev) => ({
        ...prev,
        energy: `Current Power: ${response.data.current_power}W, Total Energy: ${response.data.total_energy} kWh`,
      }));
    } catch (error) {
      Alert.alert("Error", "Failed to fetch energy data.");
    }
  };

  const handleSend = async () => {
    if (!question.trim()) return;

    if (question.toLowerCase().includes("temperature")) {
      await fetchSensorData();
      setResponse(`The current temperature is ${sensorData.temperature} °C.`);
    } else if (question.toLowerCase().includes("humidity")) {
      await fetchSensorData();
      setResponse(`The current humidity is ${sensorData.humidity}%.`);
    } else if (question.toLowerCase().includes("motion")) {
      await fetchSensorData();
      setResponse(`Motion detected: ${sensorData.motion}.`);
    } else if (question.toLowerCase().includes("power") || question.toLowerCase().includes("energy usage")) {
      await fetchEnergyData();
      setResponse(sensorData.energy);
    } else {
      if (socket) {
        socket.emit("message", { prompt: question });
        socket.on("response", (data) => {
          setResponse(data.message || "No response from the server.");
        });
      }
    }
  };

  return (
    <>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          placeholderTextColor="#999"
          value={question}
          onChangeText={setQuestion}
        />
        <Button title="Send" onPress={handleSend} />
      </KeyboardAvoidingView>

      <Modal visible={isChatOpen} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.chatContainer}>
            <Text style={styles.title}>Ask Domus</Text>

            <TextInput
              style={styles.input}
              placeholder="Type your question..."
              value={question}
              onChangeText={setQuestion}
            />

            <Button title="Send" onPress={handleSend} />

            {response && (
              <Text style={styles.response}>
                <Text style={styles.responseLabel}>Response:</Text> {response}
              </Text>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={() => setIsChatOpen(false)}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#f0f0f0",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  chatContainer: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  response: {
    marginTop: 15,
    fontSize: 16,
    color: "#333",
  },
  responseLabel: {
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#f44336",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LLMSection;