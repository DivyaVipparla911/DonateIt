import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  Platform, 
  Text, 
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  TextInput
} from "react-native";
import axios from "axios";
import * as Location from 'expo-location';

export default function MapScreen() {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  // Initialize Google Maps services when loaded
  useEffect(() => {
    if (Platform.OS === "web" && window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
    }
  }, []);

  // Get user's current location
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setError('Permission to access location was denied');
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
        const defaultLocation = { latitude: 37.7749, longitude: -122.4194 };
        setUserLocation(defaultLocation);
        fetchNearbyBoxes(defaultLocation.latitude, defaultLocation.longitude);
      }
    })();
  }, []);

  // Handle search input changes
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text.length > 2 && Platform.OS === "web" && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        { input: text, types: ['geocode'] },
        (predictions, status) => {
          if (status === 'OK') {
            setSearchResults(predictions);
            setShowSearchResults(true);
          } else {
            setShowSearchResults(false);
          }
        }
      );
    } else {
      setShowSearchResults(false);
    }
  };

  // Handle location selection from search results
  const handleLocationSelect = (place) => {
    setSearchQuery(place.description);
    setShowSearchResults(false);
    
    // Get details of the selected place
    placesService.current.getDetails(
      { placeId: place.place_id },
      (placeDetails, status) => {
        if (status === 'OK' && placeDetails.geometry && placeDetails.geometry.location) {
          const newLocation = {
            latitude: placeDetails.geometry.location.lat(),
            longitude: placeDetails.geometry.location.lng()
          };
          setUserLocation(newLocation);
          fetchNearbyBoxes(newLocation.latitude, newLocation.longitude);
          
          // Center map on selected location
          if (mapInstance.current) {
            mapInstance.current.setCenter({
              lat: newLocation.latitude,
              lng: newLocation.longitude
            });
          }
        }
      }
    );
  };

  // Fetch nearby donation boxes from MongoDB
  const fetchNearbyBoxes = async (latitude, longitude) => {
    setLoading(true);
    setError(null);
    
    try {
      // Modified to send coordinates and radius in the request
      // Limiting to 10 results with a radius of 5 miles
      const response = await axios.get(
        `http://localhost:5000/api/user/donation-boxes?lat=${latitude}&lng=${longitude}&radius=5&limit=10`
      );
      
      const nearbyBoxes = response.data;
      console.log(`Fetched ${nearbyBoxes.length} nearby boxes`);
      
      if (nearbyBoxes.length === 0) {
        console.log("No boxes found nearby, trying with a larger radius");
        // If no boxes found, try with a larger radius
        const fallbackResponse = await axios.get(
          `http://localhost:5000/api/user/donation-boxes?lat=${latitude}&lng=${longitude}&radius=20&limit=10`
        );
        nearbyBoxes.push(...fallbackResponse.data);
      }
      
      const boxesWithDistance = nearbyBoxes
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
            location: {
              coordinates: [box.coordinates.longitude, box.coordinates.latitude]
            }
          };
        });
      
      const sortedBoxes = boxesWithDistance.sort((a, b) => 
        parseFloat(a.distance) - parseFloat(b.distance)
      ).slice(0, 10); 
      
      setBoxes(sortedBoxes);
      
      if (Platform.OS === "web" && window.google?.maps) {
        initializeMap(sortedBoxes);
      }
      
    } catch (apiError) {
      console.error("API Error:", apiError);
      setError("Couldn't connect to server. Using sample data.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8;
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

  // Handle map zoom controls
  const handleZoomIn = () => {
    if (mapInstance.current) {
      const currentZoom = mapInstance.current.getZoom();
      mapInstance.current.setZoom(currentZoom + 1);
      setMapZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstance.current) {
      const currentZoom = mapInstance.current.getZoom();
      if (currentZoom > 1) {
        mapInstance.current.setZoom(currentZoom - 1);
        setMapZoom(currentZoom - 1);
      }
    }
  };

  // Initialize Google Maps
  const initializeMap = (boxesToDisplay) => {
    if (!mapRef.current || !window.google?.maps || !userLocation) return;
    
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: userLocation.latitude, lng: userLocation.longitude },
      zoom: mapZoom,
      scrollwheel: true, // Enable scroll wheel zooming
      gestureHandling: 'cooperative', // Makes the map require Ctrl+Scroll to zoom, allowing normal page scrolling
      zoomControl: false, // We'll add custom zoom controls
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true
    });
    
    mapInstance.current = map;
    
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
  };

  // Load Google Maps API
  useEffect(() => {
    if (Platform.OS === "web" && !window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDSahTexUybVADs-MwPT4MNnWai_-kTr1I&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
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
    <ScrollView 
      style={styles.mainScrollView}
      contentContainerStyle={styles.mainScrollViewContent}
      showsVerticalScrollIndicator={true}
      persistentScrollbar={true}
    >
      <View style={styles.container}>
        <Text style={styles.header}>DonateIt</Text>
        <Text style={styles.subheader}>Donation boxes near you</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a location..."
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          {showSearchResults && (
            <View style={styles.searchResultsContainer}>
              <ScrollView 
                style={styles.searchResultsScroll}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                {searchResults.map((result) => (
                  <TouchableOpacity
                    key={result.place_id}
                    style={styles.searchResultItem}
                    onPress={() => handleLocationSelect(result)}
                  >
                    <Text>{result.description}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        
        {/* Google Maps Integration */}
        {Platform.OS === "web" && (
          <View style={styles.mapContainer}>
            <View style={styles.mapHeaderContainer}>
              <Text style={styles.mapLabel}>Donation Boxes Map</Text>
              <View style={styles.mapControlsContainer}>
                <TouchableOpacity 
                  style={styles.mapControlButton}
                  onPress={handleZoomIn}
                >
                  <Text style={styles.mapControlText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.mapControlButton}
                  onPress={handleZoomOut}
                >
                  <Text style={styles.mapControlText}>-</Text>
                </TouchableOpacity>
              </View>
            </View>
            
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
            <Text style={styles.mapInstructions}>
              Use Ctrl + Scroll to zoom the map, or the +/- buttons above.
            </Text>
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
          Nearby Donation Boxes </Text>
        
        {boxes.length === 0 && !loading ? (
          <Text style={styles.noBoxesText}>No donation boxes found nearby.</Text>
        ) : (
          <View style={styles.scrollContainer}>
            <ScrollView 
              style={styles.boxesContainer}
              contentContainerStyle={styles.boxesContentContainer}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
              alwaysBounceVertical={true}
              scrollEventThrottle={16}
              nestedScrollEnabled={true}
            >
              {boxes.map((box) => (
                <View key={box._id || Math.random().toString()} style={styles.boxCard}>
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
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainScrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainScrollViewContent: {
    flexGrow: 1,
  },
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
  searchContainer: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 10
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff'
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 1000,
    maxHeight: 200,
    overflow: 'hidden'
  },
  searchResultsScroll: {
    maxHeight: 200
  },
  searchResultItem: {
    padding: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1
  },
  mapContainer: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee'
  },
  mapHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 5
  },
  mapLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  mapControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapControlButton: {
    width: 30,
    height: 30,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  mapControlText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  mapInstructions: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 5
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
  scrollContainer: {
    flex: 1,
    height: Platform.OS === 'web' ? 350 : '60%',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden'
  },
  boxesContainer: {
    flex: 1,
    height: '100%'
  },
  boxesContentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5
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
    backgroundColor: '#000',
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
    color: '#000',
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