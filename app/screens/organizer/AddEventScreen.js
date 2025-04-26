import React from "react";
import { View, Text, SafeAreaView, Button } from "react-native";
import { auth } from '../../firebaseConfig';

const logout = async () => {
  await auth.signOut();
};

const AddEventScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Add Event Screen</Text>
        <View style={{ padding: 20 }}>
          <Text>Welcome!</Text>
          <Button title="Logout" onPress={logout} />
        </View>

      </SafeAreaView>

  );
};

export default AddEventScreen;
