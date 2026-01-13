// cvat-ui/src/providers/AuthProvider.tsx
import React, { useEffect, useState, ReactNode } from 'react';
import { getCurrentUser } from './utils/authDISHAService';
// import { Navigate } from 'react-router-dom';

interface AuthProviderProps {
    children: ReactNode;
    redirectTo?: string;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            setLoading(false);
        }
        fetchUser();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (!user) {
        const currentUrl = window.location.href;
        window.location.href = process.env.REACT_APP_DISHA_FRONTEND_URL + '/login?redirect_to=' + currentUrl;
        // return <Navigate to={} replace />;
    }

    return <>{children}</>;
};
