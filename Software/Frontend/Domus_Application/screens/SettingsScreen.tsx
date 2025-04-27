// SettingsScreen.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Camera, useCameraDevice, PhotoFile } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/Ionicons';

const SettingsScreen = ({ navigation }: any) => {
  const [isFaceRecognitionEnabled, setIsFaceRecognitionEnabled] = useState(true);
  const [cameraVisible, setCameraVisible]           = useState(false);
  const [hasPermission, setHasPermission]           = useState(false);
  const [loading, setLoading]                       = useState(false);
  const cameraRef = useRef<Camera>(null);

  // get the front‐facing camera device
  const device = useCameraDevice('front');

  const handleRegisterFace = async () => {
    const current = await Camera.getCameraPermissionStatus();
    console.log('Camera status before request:', current);

    // Request permission if not already determined/granted
    // Re-requesting everytime might be slightly annoying but ensures we check
    const status = await Camera.requestCameraPermission();
    console.log('Camera status after request:', status);

    if (status === 'granted') {
      setHasPermission(true);
      setCameraVisible(true);
    } else {
      setHasPermission(false); // Ensure permission state is false if not granted
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera access in your device Settings to use this feature.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setCameraVisible(false) }, // Also close modal on cancel
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      // Optionally, you might want to close the modal here too if permission denied prompt is shown
      // setCameraVisible(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || !device) {
      Alert.alert('Error', 'Camera is not ready. Please ensure permissions are granted and a front camera exists.');
      setCameraVisible(false); // Close modal if camera isn't ready
      return;
    }

    setLoading(true);
    try {
      console.log('Taking photo...');
      // use takePhoto (more reliable than snapshot)
      const photo: PhotoFile = await cameraRef.current.takePhoto({
        flash: 'off',
        qualityPrioritization: 'speed',
        skipMetadata: true,
      });
      console.log('Photo taken:', photo);
      console.log('Photo path:', photo.path); // Log path for verification

      const uri = Platform.OS === 'ios' ? photo.path : `file://${photo.path}`;
      console.log('File URI for potential upload:', uri);

      // --- TEMPORARILY COMMENTED OUT BACKEND UPLOAD LOGIC ---
      // This section is commented out because the backend at domus-central.local
      // is not yet set up. The `await fetch` call would hang, keeping the
      // loading indicator active indefinitely. Uncomment this when the backend is ready.
      /*
      console.log('Attempting to upload to backend...');
      const formData = new FormData();
      // Ensure the filename and type are correct for your backend
      formData.append('image', { uri, name: 'face.jpg', type: 'image/jpeg' } as any);

      const res = await fetch('http://domus-central.local:5000/register-face', {
        method: 'POST',
        body: formData,
        headers: {
          // 'Content-Type': 'multipart/form-data' // This header is often set automatically by fetch when using FormData
        },
        // Consider adding a timeout for fetch if needed in the future
      });

      if (res.ok) {
        Alert.alert('Success', 'Face registered successfully!', [
          { text: 'OK', onPress: () => setCameraVisible(false) },
        ]);
      } else {
        // Try to get more detailed error from backend response
        const errorBody = await res.text();
        console.error('Server responded with an error:', res.status, errorBody);
        throw new Error(`Registration failed: ${errorBody || res.statusText}`);
      }
      */
      // --- END OF TEMPORARILY COMMENTED OUT SECTION ---

      // --- TEMPORARY SUCCESS FEEDBACK ---
      // Added this alert to confirm photo capture worked, bypassing the upload step.
      // Remove this alert when you uncomment the upload logic above.
      Alert.alert('Photo Taken (Test)', `Photo saved locally at path: ${photo.path}. Backend upload skipped.`, [
         { text: 'OK', onPress: () => setCameraVisible(false) } // Close camera modal
      ]);
      // --- END OF TEMPORARY SUCCESS FEEDBACK ---

    } catch (e: any) { // Catch errors during capture or the (commented out) upload
      console.error('Error in handleCapture:', e);
      Alert.alert('Error', `Failed during capture process: ${e.message || 'Unknown error'}. Please try again.`);
      // Don't necessarily close camera on error, user might want to retry? Or close it:
      // setCameraVisible(false);
    } finally {
      // This will now run quickly after takePhoto finishes (or fails)
      // because the await fetch() is commented out.
      console.log('Setting loading to false');
      setLoading(false);
    }
  };


  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }),
      },
    ]);
  };

  const renderCameraContent = () => {
    // Case 1: No camera device found
    if (!device) {
      return (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Front camera not available on this device.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={() => setCameraVisible(false)}>
            <Text style={styles.permissionButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      );
    }
    // Case 2: Camera device exists, but permission not granted yet
    if (!hasPermission) {
      return (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera access is required to register your face.</Text>
          {/* Button to trigger the permission request again */}
          <TouchableOpacity style={styles.permissionButton} onPress={handleRegisterFace}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          {/* Button to simply close the modal */}
          <TouchableOpacity
            style={[styles.permissionButton, styles.cancelButton]}
            onPress={() => setCameraVisible(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
           <TouchableOpacity
            style={[styles.permissionButton, styles.settingsButton]}
            onPress={() => Linking.openSettings()}>
            <Text style={styles.permissionButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      );
    }
    // Case 3: Device and permission are ready, render the camera
    return (
      <>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={cameraVisible} // Ensure isActive is tied to visibility
          photo={true}           // enable photo captures
          // Consider adding error handler prop: onError={(error) => console.error("Camera Error:", error)}
        />
        <View style={styles.cameraControls}>
           {/* Top Left Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={() => setCameraVisible(false)}>
            <Icon name="close" size={30} color="#fff" />
          </TouchableOpacity>

          {/* Bottom Center Capture Button */}
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
          {/* Placeholder for potential flip camera button or other controls */}
          <View style={{ width: 50 }} /> {/* Spacer to balance close button */}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Account</Text>

      {/* Register Face Card */}
      <TouchableOpacity
        style={styles.registerCard}
        onPress={handleRegisterFace} // This opens the modal and handles permission
        activeOpacity={0.7}>
        <View style={styles.faceIconContainer}>
          <Icon name="person-outline" size={28} color="#333" />
          <View style={styles.faceIconBorder} />
        </View>
        <View style={styles.registerTextContainer}>
          <Text style={styles.registerTitle}>Register Your Face</Text>
          <Text style={styles.registerSubtext}>Required for Facial Recognition login</Text>
        </View>
        <Icon name="chevron-forward" size={24} color="#C7C7CC" />
      </TouchableOpacity>

      <Text style={styles.heading}>Security Settings</Text>

      {/* Face Recognition Toggle */}
      <View style={[styles.settingRow, styles.firstSettingRow]}>
        <Text style={styles.settingText}>Enable Face Recognition</Text>
        <Switch
          value={isFaceRecognitionEnabled}
          onValueChange={setIsFaceRecognitionEnabled}
          trackColor={{ false: '#D1D1D6', true: '#4CD964' }}
          thumbColor={'#fff'} // Simplified thumb color
          ios_backgroundColor="#D1D1D6"
        />
      </View>

      {/* Notification Preferences (Example Row) */}
      <TouchableOpacity style={[styles.settingRow, styles.lastSettingRow]}>
        <Text style={styles.settingText}>Notification Preferences</Text>
        <Icon name="chevron-forward" size={24} color="#C7C7CC" />
      </TouchableOpacity>

      {/* Logout Button */}
      <View style={styles.logoutButtonContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>


      {/* Camera Modal */}
      <Modal
        visible={cameraVisible}
        onRequestClose={() => setCameraVisible(false)} // Good practice for Android back button
        animationType="slide">
        {/* Use SafeAreaView inside Modal too if needed, or just View */}
        <View style={styles.cameraContainer}>
            {renderCameraContent()}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // Standard iOS settings background
    // Removed padding to allow full-width elements
  },
  heading: {
    fontSize: 13, // iOS headings are usually smaller
    fontWeight: '400', // Normal weight
    color: '#6D6D72', // Standard iOS heading color
    marginTop: 32, // More top margin
    marginBottom: 8,
    paddingHorizontal: 16, // Apply padding here instead of container
    textTransform: 'uppercase', // Uppercase is common
  },
  registerCard: {
    backgroundColor: '#fff',
    borderRadius: 10, // Standard iOS corner radius
    padding: 16,
    marginHorizontal: 16, // Margin for the card
    flexDirection: 'row',
    alignItems: 'center',
    // Removed shadow, iOS settings usually use borders or grouping
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
  },
  faceIconContainer: {
    width: 40, // Slightly smaller icon container
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
     backgroundColor: '#EFEFF4', // Give icon a background
     borderRadius: 8,
  },
  faceIconBorder: { // Removed dashed border, not typical iOS style
    // display: 'none', // Hide if not needed
  },
  registerTextContainer: { flex: 1 },
  registerTitle: { fontSize: 17, color: '#000' }, // Standard iOS item title size
  registerSubtext: { fontSize: 13, color: '#666' }, // Smaller subtext
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12, // Standard iOS row height
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, // Use hairline for subtle separators
    borderBottomColor: '#C6C6C8', // Standard separator color
    marginHorizontal: 16, // Margin for grouped rows
  },
  firstSettingRow: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderTopWidth: StyleSheet.hairlineWidth, // Add top border for first item in group
    borderTopColor: '#C6C6C8',
  },
  lastSettingRow: {
     borderBottomLeftRadius: 10,
     borderBottomRightRadius: 10,
     borderBottomWidth: StyleSheet.hairlineWidth, // Keep bottom border for last item
  },
  settingText: { fontSize: 17, color: '#000' },
  logoutButtonContainer: {
    marginTop: 32, // Space above logout
    paddingHorizontal: 16, // Align with other content
    marginBottom: 40, // Space at the bottom
  },
  logoutButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  logoutText: { fontSize: 17, color: '#FF3B30', fontWeight: '400' }, // Standard destructive color, normal weight
  // --- Camera Modal Styles ---
  cameraContainer: {
      flex: 1,
      backgroundColor: '#000'
    },
  camera: {
    flex: 1, // Camera view should fill the space
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120, // Fixed height for control area
    flexDirection: 'row',
    justifyContent: 'space-between', // Space out buttons
    alignItems: 'center',
    paddingHorizontal: 30, // Padding on sides
    paddingBottom: 30, // Padding at the bottom (adjust for safe area if needed)
    backgroundColor: 'rgba(0,0,0,0.4)', // Semi-transparent background
  },
  closeButton: {
    // Positioned by flexbox space-between now
    // Removed absolute positioning
    padding: 10, // Make tappable area larger
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center', // Center itself if flex direction was column
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  // --- Permission View Styles ---
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', // Match modal background
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 25,
  },
  permissionButton: {
    backgroundColor: '#0A84FF', // Standard iOS blue
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    width: '80%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#555', // Darker grey for cancel/secondary action
    borderWidth: 0,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
   settingsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0A84FF', // Blue outline
    marginTop: 16,
  },
});

export default SettingsScreen;