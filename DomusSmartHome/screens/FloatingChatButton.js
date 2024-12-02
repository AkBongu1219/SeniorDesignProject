import React, { useState, useEffect } from "react";
import { StyleSheet, TouchableOpacity, View, Modal, TextInput, Button, Text } from "react-native";
import io from "socket.io-client";

// Main component for the floating chat button
const FloatingChatButton = () => {
  // State for chat modal visibility
  const [isChatOpen, setIsChatOpen] = useState(false);

  // State for storing user input and chatbot responses
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");

  // State for WebSocket connection
  const [socket, setSocket] = useState(null);

  // Effect to initialize WebSocket connection
  useEffect(() => {
    const newSocket = io("http://localhost:5001"); // Connect to WebSocket server
    setSocket(newSocket);

    // Cleanup WebSocket connection when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Open the chat modal
  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  // Close the chat modal and reset states
  const handleCloseChat = () => {
    setIsChatOpen(false);
    setQuestion("");
    setResponse("");
  };

  // Send user input to the WebSocket server
  const handleSend = () => {
    if (socket && question.trim()) {
      socket.emit("message", { prompt: question }); // Emit the user's query
      socket.on("response", (data) => {
        if (data.message) {
          setResponse(data.message); // Display response from the server
        } else {
          setResponse(data.error || "Failed to fetch response."); // Handle errors
        }
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Floating button to open the chat */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleOpenChat}>
        <Text style={styles.buttonText}>D</Text> {/* 'D' for Domus */}
      </TouchableOpacity>

      {/* Modal for chat interaction */}
      <Modal visible={isChatOpen} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.chatContainer}>
            <Text style={styles.title}>Ask Domus</Text> {/* Modal title */}
            
            {/* Input field for user queries */}
            <TextInput
              style={styles.input}
              placeholder="Type your question..."
              value={question}
              onChangeText={setQuestion}
            />

            {/* Button to send the query */}
            <Button title="Send" onPress={handleSend} />

            {/* Display chatbot response */}
            {response && (
              <Text style={styles.response}>
                <Text style={styles.responseLabel}>Response:</Text> {response}
              </Text>
            )}

            {/* Button to close the modal */}
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseChat}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Styles for the floating button and modal
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
