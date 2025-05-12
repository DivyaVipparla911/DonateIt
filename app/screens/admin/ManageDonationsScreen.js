import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function HomeScreen() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedDonation, setEditedDonation] = useState({});
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

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
      setDeleteModalVisible(false);
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
    <TouchableOpacity 
      onPress={() => setSelectedDonation(item)}
      style={styles.donationItem}
    >
      <View style={styles.donationContent}>
        <Text style={styles.donationTitle}>{item.name}</Text>
        <Text style={styles.donationDescription}>{item.description}</Text>
        <View style={styles.donationMeta}>
          <Icon name="location-on" size={16} color="#555" />
          <Text style={styles.donationMetaText}>{item.address.address || "Location not specified"}</Text>
        </View>
        <View style={styles.donationMeta}>
          <Icon name="person" size={16} color="#555" />
          <Text style={styles.donationMetaText}>{item.assignee || 'Unassigned'}</Text>
        </View>
        {item.dateTime && (
          <View style={styles.donationMeta}>
            <Icon name="schedule" size={16} color="#555" />
            <Text style={styles.donationMetaText}>{item.dateTime}</Text>
          </View>
        )}
      </View>
      <Icon name="chevron-right" size={24} color="#555" />
    </TouchableOpacity>
  );

  if (selectedDonation) {
    if (editMode) {
      return (
        <View style={styles.container}>
          <TouchableOpacity 
            onPress={() => setEditMode(false)} 
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color="#000" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Edit Donation Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{selectedDonation.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{selectedDonation.description}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{selectedDonation.address.address}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Donor Availability</Text>
            <Text style={styles.detailValue}>{selectedDonation.availability}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Assignee</Text>
            <TextInput
              placeholder="Enter assignee name"
              value={editedDonation.assignee}
              onChangeText={(text) =>
                setEditedDonation({ ...editedDonation, assignee: text })
              }
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Pickup Date & Time</Text>
            <TextInput
              placeholder="Enter date and time"
              value={editedDonation.dateTime}
              onChangeText={(text) =>
                setEditedDonation({ ...editedDonation, dateTime: text })
              }
              style={styles.input}
            />
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              onPress={handleSave}
              style={[styles.button, styles.saveButton]}
            >
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <TouchableOpacity 
          onPress={() => setSelectedDonation(null)} 
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.detailTitle}>{selectedDonation.name}</Text>
        
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{selectedDonation.description}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{selectedDonation.address.address}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Donor Availability</Text>
            <Text style={styles.detailValue}>{selectedDonation.availability}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assignee</Text>
            <Text style={styles.detailValue}>
              {selectedDonation.assignee || 'Unassigned'}
            </Text>
          </View>

          {selectedDonation.dateTime && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Date & Time</Text>
              <Text style={styles.detailValue}>{selectedDonation.dateTime}</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            onPress={() => {
              setEditMode(true);
              setEditedDonation({
                assignee: selectedDonation.assignee || '',
                dateTime: selectedDonation.dateTime || '',
              });
            }}
            style={[styles.button, styles.editButton]}
          >
            <Icon name="edit" size={18} color="#fff" />
            <Text style={[styles.buttonText, { marginLeft: 8 }]}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setDeleteModalVisible(true)}
            style={[styles.button, styles.deleteButton]}
          >
            <Icon name="delete" size={18} color="#fff" />
            <Text style={[styles.buttonText, { marginLeft: 8 }]}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={deleteModalVisible}
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirm Deletion</Text>
              <Text style={styles.modalText}>
                Are you sure you want to delete this donation? This action cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  onPress={() => setDeleteModalVisible(false)}
                  style={[styles.modalButton, styles.cancelButton]}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={deleteDonation}
                  style={[styles.modalButton, styles.confirmDeleteButton]}
                >
                  <Text style={styles.modalButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeTitle}>Donation Management</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.loadingText}>Loading donations...</Text>
        </View>
      ) : (
        <FlatList
          data={donations}
          keyExtractor={(item) => item._id}
          renderItem={renderDonation}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="inbox" size={48} color="#999" />
              <Text style={styles.emptyStateText}>No donations found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
  listContent: {
    paddingBottom: 20,
  },
  donationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  donationContent: {
    flex: 1,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  donationDescription: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
  },
  donationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  donationMetaText: {
    fontSize: 13,
    marginLeft: 6,
    color: '#555',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 18,
    marginLeft: 8,
    color: '#000',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000',
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#555',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    flex: 1,
  },
  editButton: {
    backgroundColor: '#333',
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  confirmDeleteButton: {
    backgroundColor: '#d32f2f',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});