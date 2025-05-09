import React, { useEffect, useState } from "react";
import { 
  View, 
  StyleSheet, 
  Platform, 
  Text, 
  ScrollView,
  TouchableOpacity
} from "react-native";
import axios from "axios";

export default function MapScreen() {
  const [boxes, setBoxes] = useState([]);

  useEffect(() => {
    // Mock data to match the image
    const mockBoxes = [
      {
        _id: "1",
        name: "Community Center Box",
        distance: "5 miles away",
        address: "123 Main Street",
        location: {
          coordinates: [-122.4194, 37.7749]
        }
      },
      {
        _id: "2",
        name: "Shopping Mall Box",
        distance: "1.2 miles away",
        address: "456 Market Street",
        location: {
          coordinates: [-122.4194, 37.7749]
        }
      },
      {
        _id: "3",
        name: "Library Donation Box",
        distance: "1.8 miles away",
        address: "789 Library Avenue",
        location: {
          coordinates: [-122.4194, 37.7749]
        }
      }
    ];
    
    // Use either mock data or API call
    setBoxes(mockBoxes);
    
    // Uncomment to use real API
    /*
    axios
      .get("http://localhost:5000/api/user/donation-boxes")
      .then((res) => setBoxes(res.data))
      .catch((err) => console.error(err));
    */
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>DonateIt</Text>
      <Text style={styles.subheader}>Search for donation boxes near you...</Text>
      
      {/* Google Maps Integration */}
      {Platform.OS === "web" && (
        <View style={styles.mapContainer}>
          <Text style={styles.mapLabel}>Google Maps Integration</Text>
          <Text style={styles.mapSubLabel}>Showing nearby donation boxes</Text>
          
          <View style={styles.divider} />
          
          {/* Google Maps iframe */}
          <iframe
            title="Donation Map"
            width="100%"
            height="300"
            frameBorder="0"
            style={{ border: 0, borderRadius: 8 }}
            src={`https://www.google.com/maps/embed/v1/view?key=&center=37.7749,-122.4194&zoom=12`}
            allowFullScreen
          />
        </View>
      )}
      
      {/* Nearby Donation Boxes List */}
      <Text style={styles.sectionHeader}>Nearby Donation Boxes</Text>
      
      <ScrollView style={styles.boxesContainer}>
        {boxes.map((box) => (
          <View key={box._id} style={styles.boxCard}>
            <Text style={styles.boxName}>{box.name}</Text>
            <Text style={styles.boxDistance}>{box.distance}</Text>
            <Text style={styles.boxAddress}>{box.address}</Text>
            
            <TouchableOpacity style={styles.directionsButton}>
              <Text style={styles.directionsText}>Directions</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000'
  },
  subheader: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20
  },
  mapContainer: {
    marginBottom: 20
  },
  mapLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: '#000'
  },
  mapSubLabel: {
    color: '#666',
    marginBottom: 10,
    fontSize: 14
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000'
  },
  boxesContainer: {
    flex: 1
  },
  boxCard: {
    marginBottom: 15
  },
  boxName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: '#000'
  },
  boxDistance: {
    color: '#666',
    marginBottom: 5,
    fontSize: 14
  },
  boxAddress: {
    color: '#333',
    marginBottom: 10,
    fontSize: 14
  },
  directionsButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 15
  },
  directionsText: {
    color: '#007AFF',
    fontWeight: 'bold'
  }
});