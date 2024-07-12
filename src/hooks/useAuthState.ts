import { useState, useEffect } from 'react';
import { auth } from '@/firebase/firebaseConfig';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

const useAuthState = () => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        }, (error) => {
            setError(error.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, loading, error };
};

export default useAuthState;