import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { initiateSocketConnection, disconnectSocket } from '../services/socketService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await api.get('auth/me');
                    localStorage.setItem('user', JSON.stringify(data));
                    initiateSocketConnection(token);
                    setUser(data);
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                    // If fetching fails, logout as token might be invalid
                    logout();
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('userId', data.user.id); // Store userId for chat
            initiateSocketConnection(data.token);
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const register = async (userData) => {
        try {
            const { data } = await api.post('auth/register', userData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('userId', data.user.id); // Store userId for chat
            initiateSocketConnection(data.token);
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        disconnectSocket();
        setUser(null);
    };

    const googleLogin = async (credential) => {
        try {
            const { data } = await api.post('auth/google', { credential });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('userId', data.user.id);
            initiateSocketConnection(data.token);
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Google login failed' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, googleLogin, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
