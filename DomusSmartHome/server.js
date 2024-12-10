const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const OpenAI = require("openai");

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// OpenAI API configuration
const openai = new OpenAI({
    apiKey: "OpenAI API", //OpenAI API key
});

// WebSocket event handler
io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("message", async (data) => {
        console.log("Message received:", data);

        const prompt = data.prompt;
        if (!prompt) {
            socket.emit("response", { error: "No prompt provided" });
            return;
        }

        try {
            // Call OpenAI API to generate a response
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are Domus, a smart home assistant." },
                    { role: "user", content: prompt },
                ],
            });

            const answer = response.choices[0].message.content;
            console.log("Generated response:", answer);

            socket.emit("response", { message: answer });
        } catch (error) {
            console.error("Error generating response:", error);
            socket.emit("response", { error: "Failed to generate response" });
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

// Start the server
const PORT = 5001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
