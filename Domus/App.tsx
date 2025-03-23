import { SafeAreaView, ScrollView, StyleSheet, Text, Image } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import TemperatureSection from "./screens/TemperatureSection";
import TheftDetectionSection from "./screens/TheftDetectionSection";
import EnergyTrackingSection from "./screens/EnergyTrackingSection";
import LLMSection from "./screens/LLMSection";
import EnergyGraphsScreen from "./screens/EnergyGraphsScreen";
import DevicesScreen from "./screens/DevicesScreen";

const Tab = createBottomTabNavigator();

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>Domus</Text>
        <TemperatureSection />
        <TheftDetectionSection />
        <EnergyTrackingSection />
      </ScrollView>
      <LLMSection />
    </SafeAreaView>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: () => {
            let iconSource;

            if (route.name === "Home") {
              iconSource = require("./assets/home.png");
            } else if (route.name === "Energy Graphs") {
              iconSource = require("./assets/flash.png");
            } else if (route.name === "Devices") {
              iconSource = require("./assets/device.png");
            }

            return <Image source={iconSource} style={{ width: 24, height: 24 }} />;
          },
          tabBarActiveTintColor: "tomato",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Energy Graphs" component={EnergyGraphsScreen} />
        <Tab.Screen name="Devices" component={DevicesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffebcd",
  },
  scrollView: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    alignSelf: "center",
  },
});

export default App;
