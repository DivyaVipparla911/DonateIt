import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  Platform, 
  Text, 
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator
} from "react-native";
import axios from "axios";
import * as Location from 'expo-location';

export default function MapScreen() {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Get user's current location
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          // Use default location (San Francisco) if permission denied
          const defaultLocation = { latitude: 37.7749, longitude: -122.4194 };
          setUserLocation(defaultLocation);
          fetchNearbyBoxes(defaultLocation.latitude, defaultLocation.longitude);
          return;
        }
        
        const location = await Location.getCurrentPositionAsync({});
        const userCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        setUserLocation(userCoords);
        fetchNearbyBoxes(userCoords.latitude, userCoords.longitude);
      } catch (err) {
        console.error("Error getting location:", err);
        setError('Failed to get your location');
        // Fallback to default location
        const defaultLocation = { latitude: 37.7749, longitude: -122.4194 };
        setUserLocation(defaultLocation);
        fetchNearbyBoxes(defaultLocation.latitude, defaultLocation.longitude);
      }
    })();
  }, []);

  // Function to fetch nearby donation boxes from MongoDB
  const fetchNearbyBoxes = async (latitude, longitude) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('http://localhost:5000/api/user/donation-boxes');
      const allBoxes = response.data;
      
      const boxesWithDistance = allBoxes
        .filter(box => box.coordinates && typeof box.coordinates.latitude === 'number' && typeof box.coordinates.longitude === 'number')
        .map(box => {
          const distance = calculateDistance(
            latitude,
            longitude,
            box.coordinates.latitude,
            box.coordinates.longitude
          );
          
          return {
            ...box,
            distance: distance.toFixed(1) + " miles away",
            // Add array format for map compatibility
            location: {
              coordinates: [box.coordinates.longitude, box.coordinates.latitude]
            }
          };
        });
      
      const sortedBoxes = boxesWithDistance.sort((a, b) => 
        parseFloat(a.distance) - parseFloat(b.distance)
      );
      
      setBoxes(sortedBoxes);
      
      if (Platform.OS === "web" && window.google?.maps) {
        initializeMap(sortedBoxes);
      }
      
    } catch (apiError) {
      console.error("API Error:", apiError);
      setError("Couldn't connect to server. Using sample data.");
      // Fallback to mock data...
    } 
    finally {
      setLoading(false);
    }
  };
      
      // 2. Fallback to mock data if API fails
  //     const mockBoxes = getMockBoxes(latitude, longitude);
  //     const boxesWithDistance = mockBoxes.map(box => {
  //       const distance = calculateDistance(
  //         latitude,
  //         longitude,
  //         box.location.coordinates[1],
  //         box.location.coordinates[0]
  //       );
        
  //       return {
  //         ...box,
  //         distance: distance.toFixed(1) + " miles away"
  //       };
  //     });
      
  //     setBoxes(boxesWithDistance);
      
  //     if (Platform.OS === "web" && window.google?.maps) {
  //       initializeMap(boxesWithDistance);
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Generate mock data for fallback
  // const getMockBoxes = (lat, lng) => {
  //   return [
  //     {
  //       _id: "1",
  //       name: "Community Center Box",
  //       address: "123 Main Street",
  //       location: {
  //         coordinates: [lng - 0.01, lat + 0.008] // [longitude, latitude]
  //       }
  //     },
  //     {
  //       _id: "2",
  //       name: "Shopping Mall Box",
  //       address: "456 Market Street",
  //       location: {
  //         coordinates: [lng + 0.005, lat - 0.003]
  //       }
  //     },
  //     {
  //       _id: "3",
  //       name: "Library Donation Box",
  //       address: "789 Library Avenue",
  //       location: {
  //         coordinates: [lng - 0.008, lat - 0.005]
  //       }
  //     }
  //   ];
  // };

  // Calculate distance between coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Open directions in Google Maps
  const openDirections = (lat, lng, name) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}(${name})`,
      android: `geo:0,0?q=${lat},${lng}(${name})`,
      web: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}`
    });
    
    Linking.openURL(url);
  };

  // Initialize Google Maps (for web platform)
  const initializeMap = (boxesToDisplay) => {
    if (!mapRef.current || !window.google?.maps || !userLocation) return;
    
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: userLocation.latitude, lng: userLocation.longitude },
      zoom: 13
    });
    
    // Add user location marker
    new window.google.maps.Marker({
      position: { lat: userLocation.latitude, lng: userLocation.longitude },
      map,
      title: "Your Location",
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      }
    });
    
    // Add markers for each donation box
    boxesToDisplay.forEach(box => {
      const marker = new window.google.maps.Marker({
        position: { 
          lat: box.location.coordinates[1], 
          lng: box.location.coordinates[0] 
        },
        map,
        title: box.name
      });
      
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <h3>${box.name}</h3>
            <p>${box.address}</p>
            <p>${box.distance}</p>
          </div>
        `
      });
      
      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    });
    
    setMapInitialized(true);
  };

  // Load Google Maps API (for web platform)
  useEffect(() => {
    if (Platform.OS === "web" && !window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDSahTexUybVADs-MwPT4MNnWai_-kTr1I&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (userLocation && boxes.length > 0) {
          initializeMap(boxes);
        }
      };
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    }
  }, [userLocation, boxes]);

  if (loading && !boxes.length) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Finding donation boxes near you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>DonateIt</Text>
      <Text style={styles.subheader}>Donation boxes near you</Text>
      
      {/* Google Maps Integration (Web Only) */}
      {Platform.OS === "web" && (
        <View style={styles.mapContainer}>
          <Text style={styles.mapLabel}>Donation Boxes Map</Text>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <div
              ref={mapRef}
              style={{
                width: '100%',
                height: 300,
                borderRadius: 8,
                overflow: 'hidden'
              }}
            />
          )}
        </View>
      )}
      
      {/* Location info */}
      {userLocation && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            {error ? "Using default location" : "Using your current location"}
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => {
              if (userLocation) {
                fetchNearbyBoxes(userLocation.latitude, userLocation.longitude);
              }
            }}
          >
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Nearby Donation Boxes List */}
      <Text style={styles.sectionHeader}>
        Nearby Donation Boxes {boxes.length > 0 ? `(${boxes.length})` : ''}
      </Text>
      
      {boxes.length === 0 && !loading ? (
        <Text style={styles.noBoxesText}>No donation boxes found nearby.</Text>
      ) : (
        <ScrollView style={styles.boxesContainer}>
          {boxes.map((box) => (
            <View key={box._id} style={styles.boxCard}>
              <Text style={styles.boxName}>{box.name}</Text>
              <Text style={styles.boxDistance}>{box.distance}</Text>
              <Text style={styles.boxAddress}>{box.address}</Text>
              
              <TouchableOpacity 
                style={styles.directionsButton}
                onPress={() => openDirections(
                  box.location.coordinates[1],
                  box.location.coordinates[0],
                  box.name
                )}
              >
                <Text style={styles.directionsText}>Directions</Text>
              </TouchableOpacity>
              
              <View style={styles.divider} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// Styles remain the same as in your original code
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee'
  },
  mapLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    color: '#000',
    paddingHorizontal: 10,
    paddingTop: 10
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
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8
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
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  directionsText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  locationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  locationText: {
    color: '#666',
    fontSize: 14
  },
  refreshButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 5
  },
  refreshText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  errorText: {
    color: 'red',
    padding: 10
  },
  loadingText: {
    marginTop: 10,
    color: '#666'
  },
  noBoxesText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20
  }
});