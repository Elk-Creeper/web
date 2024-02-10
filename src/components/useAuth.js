import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      setUser(null); // Clear the user state on logout
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return { user, logout };
};

export default useAuth;