import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView, View, Text, Button, StyleSheet } from 'react-native';
import SensorDataScreen from './screens/SensorDataScreen';
import TheftDetectionScreen from './screens/TheftDetectionScreen';
import SmartPlugScreen from './screens/SmartPlugScreen';
import WelcomeScreen from './screens/WelcomeScreen';

const Stack = createStackNavigator();

const HomeScreen = ({ navigation }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.innerContainer}>
      <Text>Welcome to the Home Screen!</Text>
      <Button
        title="Go to Sensor Data"
        onPress={() => navigation.navigate('SensorData')}
      />
      <Button
        title="Go to Theft Detection"
        onPress={() => navigation.navigate('TheftDetection')}
      />
      <Button
        title="Go to Smart Plug"
        onPress={() => navigation.navigate('SmartPlug')}
      />
    </View>
  </SafeAreaView>
);

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        {/* Hide header for WelcomeScreen */}
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        {/* Show header for all other screens */}
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Stack.Screen name="SensorData" component={SensorDataScreen} options={{ title: 'Sensor Data' }} />
        <Stack.Screen name="TheftDetection" component={TheftDetectionScreen} options={{ title: 'Theft Detection' }} />
        <Stack.Screen name="SmartPlug" component={SmartPlugScreen} options={{ title: 'Smart Plug' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
