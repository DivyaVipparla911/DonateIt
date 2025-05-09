import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebaseConfig';  // Make sure this imports Firebase auth
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';  // Add this import

const db = getFirestore();
const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          setProfileComplete(userDocSnap.exists() && userDocSnap.data().profileCreated);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...(userDocSnap.exists() ? userDocSnap.data() : {})
          });
        } else {
          setUser(null);
          setProfileComplete(false);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, profileComplete, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);