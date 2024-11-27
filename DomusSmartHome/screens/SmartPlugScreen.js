import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';

const API_BASE = 'http://10.0.0.4:8080';

const SmartPlugScreen = () => {
  const [plugState, setPlugState] = useState(false);
  const [energyData, setEnergyData] = useState({ current_power: 0, total_energy: 0 });
  const [loading, setLoading] = useState(false);

  const fetchEnergyData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/energy`);
      setEnergyData(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch energy readings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlugState = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/status`);
      setPlugState(response.data.plug_state);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch plug state.');
    } finally {
      setLoading(false);
    }
  };

  const togglePlug = async (action) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/toggle`, { action });
      setPlugState(response.data.plug_state);
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle plug state.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugState();
    fetchEnergyData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Smart Plug Control</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <React.Fragment>
          <Button
            title={plugState ? 'Turn Off' : 'Turn On'}
            onPress={() => togglePlug(plugState ? 'off' : 'on')}
          />
          <Text style={styles.energy}>
            Current Power: {energyData?.current_power?.toFixed(2) || '0'} W
          </Text>
          <Text style={styles.energy}>
            Total Energy: {energyData?.total_energy?.toFixed(3) || '0'} kWh
          </Text>
        </React.Fragment>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  energy: {
    fontSize: 18,
    marginVertical: 10,
  },
});

export default SmartPlugScreen;
