import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Feather from "react-native-vector-icons/Feather";
import HomeScreen from "./screens/HomeScreen";
import EnergyGraphsScreen from "./screens/EnergyGraphsScreen";
import DevicesScreen from "./screens/DevicesScreen";
import SurveillanceScreen from "./screens/SurveillanceScreen";
import SettingsScreen from "./screens/SettingsScreen"; // Import the new Settings screen
import GoogleLoginScreen from "./screens/GoogleLoginScreen";
import { AuthProvider, useAuth } from "./AuthContext";

const Tab = createBottomTabNavigator();

const MainApp: React.FC = () => (
  <NavigationContainer>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: string;
          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Energy") {
            iconName = "zap";
          } else if (route.name === "Devices") {
            iconName = "cpu";
          } else if (route.name === "Surveillance") {
            iconName = "video";
          } else if (route.name === "Settings") {
            iconName = "settings"; // Icon for the Settings tab
          }
          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Energy" component={EnergyGraphsScreen} />
      <Tab.Screen name="Devices" component={DevicesScreen} />
      <Tab.Screen name="Surveillance" component={SurveillanceScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  </NavigationContainer>
);

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  return user ? <MainApp /> : <GoogleLoginScreen />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default App;