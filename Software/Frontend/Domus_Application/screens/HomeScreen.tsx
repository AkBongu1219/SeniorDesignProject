import React, { useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import EnvironSensorCard from '../components/EnvironSensorCard';
import SecurityStatusCard from '../components/SecurityStatusCard';
import EnergyUsageCard from '../components/EnergyUsageCard';
import DeviceStatusCard from '../components/DeviceStatusCard';
import LLMSection from '../components/LLMSection'; // Assuming it's in components, adjust import if needed

const HomeScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Update the lastRefresh timestamp to trigger data refresh in all components
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <EnvironSensorCard lastRefresh={lastRefresh} />
        <SecurityStatusCard lastRefresh={lastRefresh} />
        <EnergyUsageCard lastRefresh={lastRefresh} />
        <DeviceStatusCard lastRefresh={lastRefresh} />
      </ScrollView>
      <LLMSection />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  scroll: {
    padding: 16,
  },
});

export default HomeScreen;
