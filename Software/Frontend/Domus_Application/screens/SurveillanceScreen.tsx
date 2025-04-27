import React from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import SurveillanceStatusCard from "../components/SurveillanceStatusCard";
import LiveCameraFeedCard from "../components/LiveCameraFeedCard";
import RecentActivityCard from "../components/RecentActivityCard";

export default function SurveillanceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <SurveillanceStatusCard />
        <LiveCameraFeedCard />
        <RecentActivityCard />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  scrollContainer: {
    padding: 20,
  },
});
