import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
  Alert,
  Platform,
  Linking,
  KeyboardAvoidingView
} from "react-native"
import Feather from "react-native-vector-icons/Feather";
import io, { Socket } from "socket.io-client"
import axios from "axios"
import Voice from '@react-native-voice/voice'
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// API URLs
const SOCKET_SERVER_URL = "http://domus-central.local:5051"; // Socket server URL
const ENERGY_API_URL = "http://domus-central.local:5050/energy"  // Energy endpoint re-enabled

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
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const recordingInterval = useRef<NodeJS.Timeout | null>(null)
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: "--",
    humidity: "--",
    pressure: "--",
    gasResistance: "--",
    motion: "--",
    energy: "--",
  })

  // Ref to track if recording is active
  const isRecordingRef = useRef(false);

  // Socket connection setup
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

  // Auto-scroll when chat history changes
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [chatHistory])

  // Pulse animation effect for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start()

      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()
      
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current)
        recordingInterval.current = null
      }
      setRecordingTime(0)
    }

    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current)
      }
    }
  }, [isRecording, pulseAnim])

  // Voice recognition setup
  useEffect(() => {
    const setupVoice = async () => {
      await Voice.destroy();

      // Update onSpeechResults to only update text if recording is active
      Voice.onSpeechResults = (e) => {
        if (isRecordingRef.current && e.value && e.value.length > 0) {
          const transcript = e.value.join(" ")
          console.log("Speech result:", transcript)
          setQuestion(transcript)
        }
      }

      Voice.onSpeechError = async (e) => {
        console.error("Speech recognition error:", e.error)
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        try {
          await Voice.stop()
        } catch (stopError) {
          console.error("Error stopping voice after error:", stopError)
        }
        setIsRecording(false)
        isRecordingRef.current = false;
        Alert.alert(
          "Voice Recognition Error",
          "An error occurred while listening. Please try again.",
          [{ text: "OK" }]
        )
      }
    }

    setupVoice();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
    }
  }, [])

  // Updated send function for both text and voice interactions
  const handleSend = async () => {
    if (!question.trim()) return
    const currentQuestion = question.trim()
    setChatHistory(prev => [...prev, { type: 'user', content: currentQuestion }])
    setQuestion("")
    await processQuestion(currentQuestion)
  }

  const handleSendVoice = async (transcript: string) => {
    if (!transcript.trim()) return
    const currentTranscript = transcript.trim()
    setChatHistory(prev => [...prev, { type: 'user', content: currentTranscript }])
    setQuestion("")
    await processQuestion(currentTranscript)
  }

  // The updated processQuestion function:
  // Checks if the query is about live energy consumption and,
  // if so, calls the backend energy API endpoint directly.
  // Otherwise, it sends the message via WebSocket to the server.
  const processQuestion = async (query: string) => {
    const lowerQuery = query.toLowerCase();

    // Check if the query relates to live energy consumption
    if (lowerQuery.includes("live energy") || lowerQuery.includes("energy consumption")) {
      try {
        const response = await axios.get(ENERGY_API_URL);
        // Assuming your backend returns an object with energy and normal consumption values.
        const { energy, normal } = response.data;
        let message = `The current live energy consumption is ${energy} watts. `;

        if (energy > normal) {
          message += "This is above normal consumption.";
        } else if (energy < normal) {
          message += "This is below normal consumption.";
        } else {
          message += "This is exactly normal.";
        }

        // Optionally update sensorData state if needed
        setSensorData(prev => ({ ...prev, energy: String(energy) }));

        setChatHistory(prev => [...prev, { type: 'assistant', content: message }]);
      } catch (error) {
        console.error("Error fetching energy data:", error);
        setChatHistory(prev => [
          ...prev,
          { type: 'assistant', content: "Sorry, there was an error fetching the live energy data." }
        ]);
      }
      return;
    } else if (socketRef.current?.connected) {
      console.log("Sending message to server:", query)
      socketRef.current.emit("message", { prompt: query })
    } else {
      setChatHistory(prev => [
        ...prev,
        { type: 'assistant', content: "Sorry, I'm not connected to the server right now. Please try again later." }
      ])
    }
  }

  // Updated permission request function for iOS
  const requestMicrophonePermission = async () => {
    try {
      const permission = PERMISSIONS.IOS.MICROPHONE;
      const currentStatus = await check(permission);
      console.log("Current microphone permission status:", currentStatus);
      if (currentStatus === RESULTS.GRANTED) {
        return true;
      }
      if (currentStatus === RESULTS.DENIED || currentStatus === RESULTS.BLOCKED) {
        Alert.alert(
          "Microphone Permission Required",
          "Microphone access is required for voice recognition. Please allow microphone access when prompted, or enable it in your device settings.",
          [
            { 
              text: "Open Settings", 
              onPress: () => Linking.openURL('app-settings:') 
            },
            { text: "Try Again", onPress: async () => {
              const newResult = await request(permission);
              return newResult === RESULTS.GRANTED;
            }},
            { text: "Cancel", style: 'cancel' }
          ]
        );
        return false;
      }
      const result = await request(permission);
      console.log("Microphone permission request result:", result);
      if (result !== RESULTS.GRANTED) {
        Alert.alert(
          "Permission Denied",
          "Voice recognition requires microphone access. Some features will be unavailable.",
          [{ text: "OK" }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error requesting microphone permission:", error);
      return false;
    }
  };

  // Updated toggleRecording using the recording ref
  const toggleRecording = async () => {
    if (isRecording) {
      try {
        await Voice.stop();
        isRecordingRef.current = false;
        setIsRecording(false);
        if (question.trim()) {
          const currentQuestion = question.trim();
          handleSendVoice(currentQuestion);
        }
        setQuestion("");
      } catch (error) {
        console.error("Error stopping voice recognition:", error);
        setIsRecording(false);
        isRecordingRef.current = false;
      }
    } else {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        console.error("Microphone permission not granted");
        return;
      }
      try {
        await Voice.destroy();
        setQuestion("");
        isRecordingRef.current = true;
        await Voice.start('en-US', {
          EXTRA_PARTIAL_RESULTS: true,
          EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 100000,
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 100000,
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 100000
        });
        setIsRecording(true);
      } catch (error) {
        console.error("Error starting voice recognition:", error);
        Alert.alert(
          "Voice Recognition Error",
          "Could not start voice recognition. Please try again.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

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

  const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : 'height';

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsChatOpen(true)}
        activeOpacity={0.8}
      >
        <Feather name="message-square" size={24} color="white" />
      </TouchableOpacity>

      <Modal visible={isChatOpen} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={keyboardBehavior} 
          style={styles.modalContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <SafeAreaView style={styles.safeAreaContainer}>
            <View style={styles.chatContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Ask Domus</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsChatOpen(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView 
                ref={scrollViewRef}
                style={styles.chatContent}
                contentContainerStyle={[
                  styles.chatContentContainer,
                  chatHistory.length > 4 && { paddingBottom: 16 }
                ]}
                showsVerticalScrollIndicator={true}
                scrollEventThrottle={16}
              >
                {chatHistory.length > 0 ? (
                  chatHistory.map(renderChatMessage)
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>
                      Ask me anything about your home!
                    </Text>
                  </View>
                )}
              </ScrollView>
              <View style={styles.inputContainer}>
                {isRecording && (
                  <View style={styles.recordingIndicator}>
                    <Text style={styles.recordingText}>Recording {formatTime(recordingTime)}</Text>
                  </View>
                )}
                <TextInput
                  style={[styles.input, isRecording && styles.inputDisabled]}
                  placeholder={isRecording ? "Recording in progress..." : "Type your question..."}
                  placeholderTextColor="#999"
                  value={question}
                  onChangeText={setQuestion}
                  multiline={false}
                  onSubmitEditing={handleSend}
                  editable={!isRecording}
                />
                <Animated.View
                  style={[
                    styles.micButtonContainer,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <TouchableOpacity 
                    style={[
                      styles.micButton,
                      isRecording && styles.micButtonRecording
                    ]}
                    onPress={toggleRecording}
                  >
                    <Feather 
                      name={isRecording ? "stop-circle" : "mic"} 
                      size={18} 
                      color={isRecording ? "white" : "#888"} 
                    />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

const { height } = Dimensions.get('window')

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(242, 242, 242, 0.97)",
  },
  safeAreaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chatContainer: {
    width: "90%",
    height: "70%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    position: "absolute",
    right: 5,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
  chatContent: {
    flex: 1,
    minHeight: height * 0.3,
  },
  chatContentContainer: {
    flexGrow: 1,
  },
  emptyStateContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#333",
  },
  sureButton: {
    alignSelf: "flex-end",
    marginTop: 12,
  },
  sureButtonText: {
    color: "#333",
    fontWeight: "500",
  },
  messageContainer: {
    maxWidth: '85%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#40E0D0',
    borderTopRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#314d6a',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: 'black',
  },
  assistantMessageText: {
    color: 'white',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    position: "relative",
  },
  input: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
  },
  micButtonContainer: {
    marginLeft: 8,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  micButtonRecording: {
    backgroundColor: "#FF4136",
  },
  recordingIndicator: {
    position: "absolute",
    top: -25,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  recordingText: {
    color: "#FF4136",
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#888",
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
  debugButton: {
    alignSelf: "center",
    marginVertical: 8,
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  debugButtonText: {
    color: "#888",
    fontSize: 12,
  },
})

export default LLMSection;
