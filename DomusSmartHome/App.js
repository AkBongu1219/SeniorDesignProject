import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, Button } from 'react-native';
import SensorDataScreen from './screens/SensorDataScreen';

const Stack = createStackNavigator();

// Define HomeScreen component directly within App.js
const HomeScreen = ({ navigation }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Welcome to the Home Screen!</Text>
    <Button
      title="Go to Sensor Data"
      onPress={() => navigation.navigate('SensorData')}
    />
  </View>
);

// Main App component with navigation setup
const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SensorData" component={SensorDataScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;