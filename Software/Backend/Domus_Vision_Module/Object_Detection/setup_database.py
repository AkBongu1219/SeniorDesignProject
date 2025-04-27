import sqlite3

# Connect to database (or create if it doesn't exist)
conn = sqlite3.connect('/home/raspberrypi/Object_detection_project/detections.db')
cursor = conn.cursor()

# Create table for storing detected objects
cursor.execute('''
    CREATE TABLE IF NOT EXISTS detections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        object_label TEXT,
        confidence REAL
    )
''')

# Commit and close
conn.commit()
conn.close()

print("Database setup complete!")
