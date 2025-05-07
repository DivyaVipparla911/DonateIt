import React, { useEffect, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import axios from "axios";

export default function MapScreen() {
  const [boxes, setBoxes] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/user/donation-boxes")
      .then((res) => setBoxes(res.data))
      .catch((err) => console.error(err));
  }, []);

  // 🧭 Render Google Maps iframe for web only
  if (Platform.OS === "web") {
    const center = "37.7749,-122.4194"; // Default center (can be dynamic)
    
    // Create markers for each donation box
    const markerParams = boxes
      .map(
        (box) =>
          `&markers=color:red%7Clabel:${encodeURIComponent(
            box.name[0] || "D"
          )}%7C${box.location.coordinates[1]},${box.location.coordinates[0]}`
      )
      .join("");

    // Construct the Google Maps URL with markers
    const url = `https://www.google.com/maps/embed/v1/view?key=&center=${center}&zoom=12${markerParams}`;

    return (
      <iframe
        title="Donation Map"
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 0, flex: 1 }}
        src={url}
        allowFullScreen
      />
    );
  }

  // Return null for mobile or use some placeholder if needed for mobile
  return <View style={styles.container}></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
