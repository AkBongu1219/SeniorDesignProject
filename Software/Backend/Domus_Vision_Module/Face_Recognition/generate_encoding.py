import face_recognition
import pickle

# Loading image of my face 
image = face_recognition.load_image_file("face0.jpg")

# Generate the face encoding for the image
face_encodings = face_recognition.face_encodings(image)

# Checking if an encoding was found
if len(face_encodings) > 0:
    your_encoding = face_encodings[0]
    print("Face encoding generated successfully!")

    # Save the encoding to a file
    with open("face_encoding.pkl", "wb") as file:
        pickle.dump(your_encoding, file)
    print("Face encoding saved as 'your_face_encoding.pkl'")
else:
    print("No face detected in the image. Please use a clearer image.")
