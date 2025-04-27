const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const openai = new OpenAI({
    apiKey: "<INSERT OPENAI API KEY>", // Replace with your real key
});

// API URLs
const DETECTION_API = "http://domus-central.local:8080/latest_detections";
const SENSOR_API = "http://domus-central.local:5000/bme688-latest";
const ENERGY_API = "http://domus-central.local:5050/energy"; // 
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
            // Fetch object detection data
            const detectionResponse = await axios.get(DETECTION_API);
            const detections = detectionResponse.data.detections;

            let detectionText = "Current camera view detections:\n";
            if (detections.length > 0) {
                detectionText += detections.map(d =>
                    - ${d.label} (Confidence: ${d.confidence}%) at ${d.timestamp}
                ).join("\n");
            } else {
                detectionText += "No objects detected.";
            }

            // Fetch sensor data (BME688)
            const sensorResponse = await axios.get(SENSOR_API);
            const sensorData = sensorResponse.data;

            let sensorText = "Current environmental readings:\n";
            if (sensorData && sensorData.temperature !== undefined) {
                sensorText += - Temperature: ${sensorData.temperature.toFixed(1)} °C\n;
                sensorText += - Humidity: ${sensorData.humidity.toFixed(1)} %\n;
                sensorText += - Pressure: ${sensorData.pressure.toFixed(1)} hPa\n;
                sensorText += - Air Quality (gas resistance): ${sensorData.gas_resistance.toFixed(1)} Ohms\n;
            } else {
                sensorText += "No sensor data available.";
            }

            // Fetch energy usage data
            const energyResponse = await axios.get(ENERGY_API);
            const energyData = energyResponse.data;

            let energyText = "Current energy usage:\n";
            if (energyData && energyData.current_power !== undefined) {
                energyText += - Current Power: ${energyData.current_power} W\n;
                energyText += - Daily Energy: ${energyData.daily_energy} kWh\n;
                energyText += - Total Energy: ${energyData.total_energy} kWh\n;
            } else {
                energyText += "No energy data available.";
            }

            // Send to OpenAI
            const openaiResponse = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are Domus, a smart home assistant. You have access to live object detection data, energy usage stats, and environmental sensor readings. Use this information to answer questions about what is in the room, the temperature, air quality, or energy usage." },
                    { role: "system", content: detectionText },
                    { role: "system", content: sensorText },
                    { role: "system", content: energyText },
                    { role: "user", content: prompt }
                ],
            });

            const answer = openaiResponse.choices[0].message.content;
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

const PORT = 5051;
server.listen(PORT, '0.0.0.0', () => {
    console.log(Server is running and accessible over the network at http://domus-central.local:${PORT});
});