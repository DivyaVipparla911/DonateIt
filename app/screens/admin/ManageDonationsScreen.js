import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

export default function HomeScreen() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedDonation, setEditedDonation] = useState({});

  const fetchDonations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/user/donations');
      setDonations(response.data);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const deleteDonation = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/donations/${selectedDonation._id}`,
        selectedDonation
      );
      setSelectedDonation(null);
      setEditMode(false);
      fetchDonations();
    } catch (error) {
      console.error('Error deleting donation:', error);
    }
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/donations/${selectedDonation._id}`,
        editedDonation
      );
      setSelectedDonation(null);
      setEditMode(false);
      fetchDonations();
    } catch (error) {
      console.error('Error updating donation:', error);
    }
  };

  const renderDonation = ({ item }) => (
    <TouchableOpacity onPress={() => setSelectedDonation(item)}>
      <View style={{ padding: 10, marginVertical: 5, backgroundColor: '#f0f0f0' }}>
        <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
        <Text>{item.description}</Text>
        <Text>Location: {item.location || item.address}</Text>
        <Text>Status: {item.status || 'N/A'}</Text>
        <Text>Assignee: {item.assignee || 'Unassigned'}</Text>
        <Text>Pickup Date and Time: {item.dateTime || 'Unassigned'}</Text>

      </View>
    </TouchableOpacity>
  );

  if (selectedDonation) {
    if (editMode) {
      return (
        <View style={{ padding: 20, flex: 1 }}>
          <TouchableOpacity onPress={() => setEditMode(false)} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 24 }}>← Back</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 20, marginBottom: 10 }}>Edit Status & Assignee</Text>

          <Text style={{ marginBottom: 5, fontWeight: 'bold' }}>Name</Text>
          <Text style={{ marginBottom: 10 }}>{selectedDonation.name}</Text>

          <Text style={{ marginBottom: 5, fontWeight: 'bold' }}>Description</Text>
          <Text style={{ marginBottom: 10 }}>{selectedDonation.description}</Text>

          <Text style={{ marginBottom: 5, fontWeight: 'bold' }}>Location</Text>
          <Text style={{ marginBottom: 10 }}>{selectedDonation.location}</Text>

          <Text style={{ marginBottom: 5 }}>Status</Text>
          <Picker
            selectedValue={editedDonation.status}
            onValueChange={(value) =>
              setEditedDonation({ ...editedDonation, status: value })
            }
            style={{ borderWidth: 1, marginBottom: 10 }}
          >
            <Picker.Item label="Select Status" value="" />
            <Picker.Item label="Pending" value="pending" />
            <Picker.Item label="Approved" value="approved" />
            <Picker.Item label="Rejected" value="rejected" />
          </Picker>

          <TextInput
            placeholder="Assignee"
            value={editedDonation.assignee}
            onChangeText={(text) =>
              setEditedDonation({ ...editedDonation, assignee: text })
            }
            style={{ borderWidth: 1, padding: 8, marginBottom: 20 }}
          />

         <TextInput
            placeholder="Date and Time"
            value={editedDonation.dateTime}
            onChangeText={(text) =>
              setEditedDonation({ ...editedDonation, dateTime: text })
            }
            style={{ borderWidth: 1, padding: 8, marginBottom: 20 }}
          />
          <Button title="Save Changes" onPress={handleSave} />
        </View>
      );
    }

    return (
      <View style={{ padding: 20, flex: 1 }}>
        <TouchableOpacity onPress={() => setSelectedDonation(null)} style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 24 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{selectedDonation.name}</Text>
        <Text style={{ marginTop: 10 }}>Description: {selectedDonation.description}</Text>
        <Text>Location: {selectedDonation.location}</Text>
        <Text>Status: {selectedDonation.status || 'N/A'}</Text>
        <Text>Assignee: {selectedDonation.assignee || 'Unassigned'}</Text>

        <View style={{ marginTop: 30 }}>
          <Button
            title="Edit"
            onPress={() => {
              setEditMode(true);
              setEditedDonation({
                status: selectedDonation.status || '',
                assignee: selectedDonation.assignee || '',
                dateTime: selectedDonation.dateTime || '',
              });
            }}
          />
          <View style={{ marginTop: 10 }}>
            <Button title="Delete" color="red" onPress={deleteDonation} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ padding: 20, flex: 1 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Welcome!</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={donations}
          keyExtractor={(item) => item._id}
          renderItem={renderDonation}
          contentContainerStyle={{ marginTop: 20 }}
        />
      )}
    </View>
  );
}
