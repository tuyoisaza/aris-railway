import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Admin email whitelist
const ADMIN_EMAILS = ['thetboard@gmail.com'];

export const AdminRoute = ({ children }) => {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

    if (!isAdmin) {
        return (
            <div className="unauthorized">
                <h1>403 - Acceso Denegado</h1>
                <p>No tienes permisos para acceder a esta sección.</p>
            </div>
        );
    }

    return children;
};

export const useIsAdmin = () => {
    const { user } = useAuth();
    return user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
};
