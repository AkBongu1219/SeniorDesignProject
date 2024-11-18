import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, Button } from 'react-native';
import SensorDataScreen from './screens/SensorDataScreen';
import TheftDetectionScreen from './screens/TheftDetectionScreen'; // Import the new screen

const Stack = createStackNavigator();

const HomeScreen = ({ navigation }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Welcome to the Home Screen!</Text>
    <Button
      title="Go to Sensor Data"
      onPress={() => navigation.navigate('SensorData')}
    />
    <Button
      title="Go to Theft Detection"
      onPress={() => navigation.navigate('TheftDetection')}
    />
  </View>
);

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Stack.Screen name="SensorData" component={SensorDataScreen} options={{ title: 'Sensor Data' }} />
        <Stack.Screen name="TheftDetection" component={TheftDetectionScreen} options={{ title: 'Theft Detection' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
