from flask import Flask, jsonify
import sqlite3
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/latest_detections": {"origins": "*"}})
db_path = "/home/raspberrypi/Object_detection_project/detections.db"

def get_latest_detection():
    """ Fetch the latest detected objects from the database """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT object_label, confidence, timestamp FROM detections ORDER BY timestamp DESC LIMIT 5")
    data = cursor.fetchall()
    conn.close()
    return [{"label": row[0], "confidence": row[1], "timestamp": row[2]} for row in data]

@app.route('/latest_detections', methods=['GET'])
def latest_detections():
    """ API Endpoint to fetch latest detections """
    detections = get_latest_detection()
    return jsonify({"detections": detections})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=True)
