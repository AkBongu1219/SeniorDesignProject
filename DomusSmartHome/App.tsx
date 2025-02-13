import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import TemperatureSection from './screens/TemperatureSection';
import TheftDetectionSection from './screens/TheftDetectionSection';
import EnergyTrackingSection from './screens/EnergyTrackingSection';
import LLMSection from './screens/LLMSection';

const Stack = createStackNavigator();

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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffebcd',
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