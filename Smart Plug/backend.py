from flask import Flask, jsonify, request
from flask_cors import CORS
import asyncio
from kasa import SmartPlug
import logging

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  

PLUG_IP = "10.0.0.25"  #Smart Plug IP 


async def get_plug():
    plug = SmartPlug(PLUG_IP)
    try:
        await plug.update()
        logging.info(f"Smart plug state updated: {plug}")
        return plug
    except Exception as e:
        logging.error(f"Failed to connect to the smart plug: {e}")
        raise


async def fetch_emeter_with_retries(plug, retries=3, delay=2):
    for i in range(retries):
        try:
            emeter_data = await plug.get_emeter_realtime()
            if emeter_data.get("power_mw") or emeter_data.get("total_wh"):
                logging.info(f"Energy data fetched on attempt {i+1}: {emeter_data}")
                return emeter_data
        except Exception as e:
            logging.warning(f"Attempt {i+1}/{retries}: Failed to fetch energy data. Error: {e}")
        await asyncio.sleep(delay)
    logging.error("All retry attempts failed. Returning default energy values.")
    return {"power_mw": 0, "total_wh": 0}


@app.before_request
def log_request_info():
    logging.info(f"Request: {request.method} {request.url}")


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to the Smart Plug Backend"}), 200


@app.route("/favicon.ico")
def favicon():
    return "", 204


@app.route("/toggle", methods=["POST"])
def toggle_plug():
    action = request.json.get("action")
    try:
        async def perform_action():
            plug = await get_plug()
            if action == "on":
                await plug.turn_on()
                logging.info("Plug turned on.")
            elif action == "off":
                await plug.turn_off()
                logging.info("Plug turned off.")
            else:
                return {"error": "Invalid action"}, 400
            return {"status": "success", "plug_state": plug.is_on}

        result = asyncio.run(perform_action())
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error toggling plug: {e}")
        return jsonify({"error": "Failed to toggle plug state"}), 500


@app.route("/energy", methods=["GET"])
def energy_readings():
    try:
        async def get_energy():
            plug = await get_plug()
            emeter_data = await fetch_emeter_with_retries(plug)

            power_watts = emeter_data.get("power_mw", 0) / 1000  # Convert mW to W
            total_kwh = emeter_data.get("total_wh", 0) / 1000  # Convert Wh to kWh

            logging.info(f"Final energy data: {emeter_data}")
            return {
                "current_power": power_watts,
                "total_energy": total_kwh,
            }

        result = asyncio.run(get_energy())
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error fetching energy data: {e}")
        return jsonify({"error": "Failed to fetch energy data"}), 500


@app.route("/status", methods=["GET"])
def plug_status():
    try:
        async def get_status():
            plug = await get_plug()
            state = plug.is_on
            logging.info(f"Plug state fetched: {'on' if state else 'off'}")
            return {"plug_state": state}

        result = asyncio.run(get_status())
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error fetching plug status: {e}")
        return jsonify({"error": "Failed to fetch plug status"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
