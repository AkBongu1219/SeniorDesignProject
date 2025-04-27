import tensorflow as tf

# Path to the SavedModel directory
saved_model_dir = "/home/raspberrypi/Object_detection_project/ssd_mobilenet_v1_coco_2018_01_28/saved_model"

# Convert the model
converter = tf.lite.TFLiteConverter.from_saved_model(saved_model_dir)
tflite_model = converter.convert()

# Save the converted model to a file
with open("/home/raspberrypi/Object_detection_project/mobilenet_ssd.tflite", "wb") as f:
    f.write(tflite_model)

print("Conversion completed! The model is saved as mobilenet_ssd.tflite")

