import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Auth-Kontext erstellen
const AuthContext = createContext();

// Auth-Provider-Komponente
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Beim Laden der App prüfen, ob ein Benutzer angemeldet ist
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          
          // Optional: Benutzerdaten vom Server aktualisieren
          try {
            const { benutzer } = await authService.getProfile();
            setUser(benutzer);
            localStorage.setItem('user', JSON.stringify(benutzer));
          } catch (err) {
            console.error('Fehler beim Abrufen des Profils:', err);
            // Bei Fehler (z.B. abgelaufenes Token) ausloggen
            if (err.response && err.response.status === 401) {
              logout();
            }
          }
        }
      } catch (err) {
        console.error('Fehler beim Überprüfen des Anmeldestatus:', err);
        setError('Fehler beim Überprüfen des Anmeldestatus');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Anmelden
  const login = async (email, passwort) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, passwort);
      if (data.erfolg) {
        setUser(data.benutzer);
        navigate('/dashboard');
        return true;
      } else {
        setError(data.nachricht || 'Anmeldung fehlgeschlagen');
        return false;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.nachricht || 'Anmeldung fehlgeschlagen';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Registrieren
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.register(userData);
      if (data.erfolg) {
        // Erfolgsnachricht zurückgeben
        return { success: true, message: data.nachricht || 'Registrierung erfolgreich. Bitte prüfen Sie Ihr E-Mail-Postfach.' };
      } else {
        setError(data.nachricht || 'Registrierung fehlgeschlagen');
        return { success: false, message: data.nachricht || 'Registrierung fehlgeschlagen' };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.nachricht || 'Registrierung fehlgeschlagen';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Abmelden
  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/login');
  };

  // Profil aktualisieren
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.updateProfile(userData);
      if (data.erfolg) {
        setUser(data.benutzer);
        localStorage.setItem('user', JSON.stringify(data.benutzer));
        return { erfolg: true, nachricht: 'Profil erfolgreich aktualisiert' };
      } else {
        setError(data.nachricht || 'Aktualisierung fehlgeschlagen');
        return { erfolg: false, nachricht: data.nachricht };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.nachricht || 'Aktualisierung fehlgeschlagen';
      setError(errorMessage);
      return { erfolg: false, nachricht: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Prüfen, ob der Benutzer angemeldet ist
  const isAuthenticated = !!user;

  // Prüfen, ob der Benutzer ein Admin ist
  const isAdmin = user?.rolle === 'admin';

  // Werte für den Kontext
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated,
    isAdmin,
    setError,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook für den einfachen Zugriff auf den Auth-Kontext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth muss innerhalb eines AuthProviders verwendet werden');
  }
  return context;
};

export default AuthContext; 