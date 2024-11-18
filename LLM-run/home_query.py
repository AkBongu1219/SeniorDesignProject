import json
from datetime import datetime
from ollama import Client

client = Client()

# Load the sensor data from the JSON file
def load_sensor_data(file_path='sensor_data.json'):
    with open(file_path, 'r') as f:
        return json.load(f)

# Function to generate a prompt for LLaMA based on user query
def generate_prompt(query, sensor_data):
    prompt = f"""
You are a smart home assistant. The latest sensor data available is:
- Temperature: {sensor_data['temperature']}°C
- Humidity: {sensor_data['humidity']}%
- Motion Detected: {'Yes' if sensor_data['motion_detected'] else 'No'}
- Timestamp: {sensor_data['timestamp']}

Answer the following query:
{query}
"""
    return prompt

# Query the LLaMA model with the generated prompt
def query_llama(query, sensor_data):
    prompt = generate_prompt(query, sensor_data)
    try:
        # Use the correct model name
        response = client.generate(
            model="llama3.2:latest",
            prompt=prompt
        )
        # Extract the response text
        return response['response']  # Corrected key access
    except Exception as e:
        print(f"Error querying LLaMA: {e}")
        return None

if __name__ == '__main__':
    # Load the latest sensor data
    sensor_data = load_sensor_data()

    # Example query (replace with dynamic input if needed)
    queries = [
        "What is the temperature in the room right now?",
        "What is the humidity level currently?",
        "Has any motion been detected in the room?"
    ]

    # Iterate through each query and get the LLaMA model response
    for user_query in queries:
        print(f"\nUser Query: {user_query}")
        response = query_llama(user_query, sensor_data)
        
        if response:
            print("LLaMA Response:", response)
