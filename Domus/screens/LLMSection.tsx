import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native"
import io, { type Socket } from "socket.io-client"
import axios from "axios"

// API URLs
const SOCKET_SERVER_URL = "http://localhost:5001"
const BME688_API_URL = "http://172.20.10.2:5000/bme688-latest"
const MOTION_API_URL = "http://172.20.10.2:5000/motion-latest"
const ENERGY_API_URL = "http://10.0.0.25:8080/energy"

interface SensorData {
  temperature: string
  humidity: string
  pressure: string
  gasResistance: string
  motion: string
  energy: string
}

interface SocketResponse {
  message: string
}

interface ChatMessage {
  type: 'user' | 'assistant'
  content: string
}

const LLMSection: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const socketRef = useRef<Socket | null>(null)
  const scrollViewRef = useRef<ScrollView>(null)
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: "--",
    humidity: "--",
    pressure: "--",
    gasResistance: "--",
    motion: "--",
    energy: "--",
  })

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    const socket = socketRef.current

    socket.on("connect", () => {
      console.log("Connected to server")
    })

    socket.on("disconnect", () => {
      console.log("Disconnected from server")
    })

    socket.on("response", (data: SocketResponse) => {
      console.log("Response received from server:", data.message)
      if (data.message) {
        setChatHistory(prev => [...prev, { type: 'assistant', content: data.message }])
      }
    })

    // socket.on("connect_error", (error) => {
    //   console.error("Connection error:", error)
    //   Alert.alert("Connection Error", "Failed to connect to the server")
    // })

    return () => {
      if (socket) {
        socket.off("connect")
        socket.off("disconnect")
        socket.off("response")
        socket.off("connect_error")
        socket.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    // Scroll to bottom when chat history updates
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true })
    }
  }, [chatHistory])

  const fetchSensorData = useCallback(async () => {
    try {
      const responseBME = await axios.get(BME688_API_URL)
      const responseMotion = await axios.get(MOTION_API_URL)
      setSensorData((prev) => ({
        ...prev,
        temperature: responseBME.data.temperature,
        humidity: responseBME.data.humidity,
        pressure: responseBME.data.pressure,
        gasResistance: responseBME.data.gas_resistance,
        motion: responseMotion.data.motion,
      }))
    } catch (error) {
      Alert.alert("Error", "Failed to fetch sensor data.")
    }
  }, [])

  const fetchEnergyData = useCallback(async () => {
    try {
      const response = await axios.get(ENERGY_API_URL)
      setSensorData((prev) => ({
        ...prev,
        energy: `Current Power: ${response.data.current_power}W, Total Energy: ${response.data.total_energy} kWh`,
      }))
    } catch (error) {
      Alert.alert("Error", "Failed to fetch energy data.")
    }
  }, [])

  const handleSend = useCallback(async () => {
    if (!question.trim()) return

    // Add user message to chat history
    setChatHistory(prev => [...prev, { type: 'user', content: question }])

    if (question.toLowerCase().includes("temperature")) {
      await fetchSensorData()
      setChatHistory(prev => [...prev, { 
        type: 'assistant', 
        content: `The current temperature is ${sensorData.temperature} °C.`
      }])
    } else if (question.toLowerCase().includes("humidity")) {
      await fetchSensorData()
      setChatHistory(prev => [...prev, { 
        type: 'assistant', 
        content: `The current humidity is ${sensorData.humidity}%.`
      }])
    } else if (question.toLowerCase().includes("motion")) {
      await fetchSensorData()
      setChatHistory(prev => [...prev, { 
        type: 'assistant', 
        content: `Motion detected: ${sensorData.motion}.`
      }])
    } else if (
      question.toLowerCase().includes("power") ||
      question.toLowerCase().includes("energy usage")
    ) {
      await fetchEnergyData()
      setChatHistory(prev => [...prev, { 
        type: 'assistant', 
        content: sensorData.energy
      }])
    } else {
      if (socketRef.current?.connected) {
        console.log("Sending message to server:", question)
        socketRef.current.emit("message", { prompt: question })
      } else {
        Alert.alert("Error", "Not connected to server")
      }
    }
    setQuestion("") // Clear the input after sending
  }, [question, fetchSensorData, fetchEnergyData, sensorData])

  const renderChatMessage = (message: ChatMessage, index: number) => {
    const isUser = message.type === 'user'
    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        <Text style={[
          styles.messageText,
          isUser ? styles.userMessageText : styles.assistantMessageText,
        ]}>
          {message.content}
        </Text>
      </View>
    )
  }

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsChatOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>💬</Text>
      </TouchableOpacity>

      <Modal visible={isChatOpen} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <View style={styles.chatContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Ask Domus</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsChatOpen(false)}
                >
                  <Text style={styles.closeButtonText}>✖</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                ref={scrollViewRef}
                style={styles.chatContent}
                contentContainerStyle={styles.chatContentContainer}
              >
                {chatHistory.length > 0 ? (
                  chatHistory.map(renderChatMessage)
                ) : (
                  <Text style={styles.emptyStateText}>
                    Ask me anything about your home!
                  </Text>
                )}
              </ScrollView>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Type your question..."
                  placeholderTextColor="#999"
                  value={question}
                  onChangeText={setQuestion}
                  multiline
                  onSubmitEditing={handleSend}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !question.trim() && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!question.trim()}
                >
                  <Text style={styles.sendButtonText}>📤</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  )
}

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
    maxHeight: 100,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  chatContainer: {
    width: "90%",
    height: "80%",
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
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#007BFF",
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: "white",
    fontSize: 24,
  },
  keyboardView: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  chatContent: {
    flex: 1,
    width: "100%",
    marginBottom: 10,
  },
  chatContentContainer: {
    paddingVertical: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 12,
    borderRadius: 15,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007BFF',
    borderTopRightRadius: 5,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: '#333',
  },
  emptyStateText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  sendButton: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    padding: 12,
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  sendButtonText: {
    color: "white",
    fontSize: 16,
  },
})

export default LLMSection