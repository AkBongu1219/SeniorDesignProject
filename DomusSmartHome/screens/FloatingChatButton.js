import React, { useState, useEffect } from "react";
import { StyleSheet, TouchableOpacity, View, Modal, TextInput, Button, Text } from "react-native";
import io from "socket.io-client";

// Sensor data API URLs
const bme688ApiUrl = 'http://172.20.10.2:5000/bme688-latest'; 
const motionApiUrl = 'http://172.20.10.2:5000/motion-latest';

const FloatingChatButton = () => {
  const [isChatOpen, setIsChatOpen] = useState(false); // Chat visibility
  const [question, setQuestion] = useState(""); // User input
  const [response, setResponse] = useState(""); // Chatbot response
  const [socket, setSocket] = useState(null); // WebSocket connection
  const [sensorData, setSensorData] = useState({
    temperature: "--",
    humidity: "--",
    pressure: "--",
    gasResistance: "--",
    motion: "--",
  }); // Store fetched sensor data

  // Initialize WebSocket
  useEffect(() => {
    const newSocket = io("http://localhost:5001");
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch live sensor data
  const fetchSensorData = async () => {
    try {
      // Fetch BME688 sensor data
      const responseBME = await fetch(bme688ApiUrl);
      const dataBME = await responseBME.json();

      // Fetch motion data
      const responseMotion = await fetch(motionApiUrl);
      const dataMotion = await responseMotion.json();

      // Update state with fetched data
      setSensorData({
        temperature: dataBME.temperature,
        humidity: dataBME.humidity,
        pressure: dataBME.pressure,
        gasResistance: dataBME.gas_resistance,
        motion: dataMotion.motion,
      });
    } catch (error) {
      console.error("Error fetching sensor data:", error);
    }
  };

  // Handle chat queries
  const handleSend = async () => {
    if (!question.trim()) return;

    // Check for sensor-related queries
    if (question.toLowerCase().includes("temperature")) {
      await fetchSensorData();
      setResponse(`The current temperature is ${sensorData.temperature} °C.`);
    } else if (question.toLowerCase().includes("humidity")) {
      await fetchSensorData();
      setResponse(`The current humidity is ${sensorData.humidity}%.`);
    } else if (question.toLowerCase().includes("motion")) {
      await fetchSensorData();
      setResponse(`Motion detected: ${sensorData.motion}.`);
    } else {
      // Send other queries to the LLM
      if (socket) {
        socket.emit("message", { prompt: question });
        socket.on("response", (data) => {
          setResponse(data.message || "No response from the server.");
        });
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={styles.floatingButton} onPress={() => setIsChatOpen(true)}>
        <Text style={styles.buttonText}>D</Text>
      </TouchableOpacity>

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
    </View>
  );
};

// User Interface 
const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#4CAF50",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
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

export default FloatingChatButton;