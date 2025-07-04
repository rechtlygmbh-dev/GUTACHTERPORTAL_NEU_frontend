import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { caseService } from '../services/api';
import { useAuth } from './AuthContext';

// Case-Kontext erstellen
const CaseContext = createContext();

// Case-Provider-Komponente
export const CaseProvider = ({ children }) => {
  const [cases, setCases] = useState([]);
  const [currentCase, setCurrentCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    kategorie: '',
    prioritaet: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const { isAuthenticated } = useAuth();

  // Fälle laden
  const loadCases = useCallback(async (queryFilters = {}) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const appliedFilters = { ...filters, ...queryFilters };
      const filtersChanged = JSON.stringify(appliedFilters) !== JSON.stringify(filters);
      if (filtersChanged) {
        setFilters(appliedFilters);
      }
      const data = await caseService.getCases(appliedFilters);
      if (data.erfolg) {
        setCases(data.faelle);
        setPagination({
          page: data.seite,
          pages: data.seiten,
          total: data.gesamt
        });
      } else {
        setError(data.nachricht || 'Fehler beim Laden der Fälle');
      }
    } catch (err) {
      console.error('Fehler beim Laden der Fälle:', err);
      setError(err.response?.data?.nachricht || 'Fehler beim Laden der Fälle');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filters]);

  // Automatische Aktualisierung nach Dokumentenänderungen
  useEffect(() => {
    const handleDocumentChange = () => {
      console.log('📄 Dokumentenänderung erkannt, aktualisiere Fälle...');
      loadCases();
    };

    const handleDatenschutzChange = () => {
      console.log('📝 Datenschutzänderung erkannt, aktualisiere Fälle...');
      loadCases();
    };

    // Event-Listener für Dokumentenänderungen
    window.addEventListener('documentChange', handleDocumentChange);
    window.addEventListener('datenschutzChange', handleDatenschutzChange);

    return () => {
      window.removeEventListener('documentChange', handleDocumentChange);
      window.removeEventListener('datenschutzChange', handleDatenschutzChange);
    };
  }, [loadCases]);

  // Fall nach ID laden
  const getCaseById = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await caseService.getCaseById(id);
      
      if (data.erfolg) {
        setCurrentCase(data.fall);
        return data.fall;
      } else {
        setError(data.nachricht || 'Fall nicht gefunden');
        return null;
      }
    } catch (err) {
      console.error('Fehler beim Laden des Falls:', err);
      setError(err.response?.data?.nachricht || 'Fehler beim Laden des Falls');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Neuen Fall erstellen
  const createCase = async (caseData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await caseService.createCase(caseData);
      
      if (data.erfolg) {
        loadCases();
        return { erfolg: true, fall: data.fall };
      } else {
        setError(data.nachricht || 'Fehler beim Erstellen des Falls');
        return { erfolg: false, nachricht: data.nachricht };
      }
    } catch (err) {
      console.error('Fehler beim Erstellen des Falls:', err);
      const errorMessage = err.response?.data?.nachricht || 'Fehler beim Erstellen des Falls';
      setError(errorMessage);
      return { erfolg: false, nachricht: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fall aktualisieren
  const updateCase = async (id, caseData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await caseService.updateCase(id, caseData);
      
      if (data.erfolg) {
        if (currentCase && currentCase._id === id) {
          setCurrentCase(data.fall);
        }
        loadCases();
        return { erfolg: true, fall: data.fall };
      } else {
        setError(data.nachricht || 'Fehler beim Aktualisieren des Falls');
        return { erfolg: false, nachricht: data.nachricht };
      }
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Falls:', err);
      const errorMessage = err.response?.data?.nachricht || 'Fehler beim Aktualisieren des Falls';
      setError(errorMessage);
      return { erfolg: false, nachricht: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fall löschen
  const deleteCase = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await caseService.deleteCase(id);
      
      if (data.erfolg) {
        setCases(cases.filter(c => c._id !== id));
        if (currentCase && currentCase._id === id) {
          setCurrentCase(null);
        }
        return { erfolg: true, nachricht: data.nachricht };
      } else {
        setError(data.nachricht || 'Fehler beim Löschen des Falls');
        return { erfolg: false, nachricht: data.nachricht };
      }
    } catch (err) {
      console.error('Fehler beim Löschen des Falls:', err);
      const errorMessage = err.response?.data?.nachricht || 'Fehler beim Löschen des Falls';
      setError(errorMessage);
      return { erfolg: false, nachricht: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Notiz zu einem Fall hinzufügen
  const addCaseNote = async (id, text) => {
    setLoading(true);
    setError(null);
    try {
      const data = await caseService.addCaseNote(id, text);
      
      if (data.erfolg) {
        // Wenn es der aktuelle Fall ist, aktualisieren
        if (currentCase && currentCase._id === id) {
          setCurrentCase(data.fall);
        }
        
        return { erfolg: true, fall: data.fall };
      } else {
        setError(data.nachricht || 'Fehler beim Hinzufügen der Notiz');
        return { erfolg: false, nachricht: data.nachricht };
      }
    } catch (err) {
      console.error('Fehler beim Hinzufügen der Notiz:', err);
      const errorMessage = err.response?.data?.nachricht || 'Fehler beim Hinzufügen der Notiz';
      setError(errorMessage);
      return { erfolg: false, nachricht: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Seite ändern (Paginierung)
  const changePage = (page) => {
    loadCases({ ...filters, page });
  };

  // Filter zurücksetzen
  const resetFilters = () => {
    const resetFilters = {
      status: '',
      kategorie: '',
      prioritaet: '',
      page: 1,
      limit: 10
    };
    setFilters(resetFilters);
    loadCases(resetFilters);
  };

  // Beim ersten Laden Fälle abrufen
  useEffect(() => {
    if (isAuthenticated) {
      loadCases();
    }
    // eslint-disable-next-line
  }, [isAuthenticated]);

  // Hilfsfunktion für Aufgabenstatus
  const isFilled = (value) => value !== undefined && value !== null;

  // Hilfsfunktion für Dokument-Kategorien
  const hasDokument = (dokumente, kategorie) => {
    if (!dokumente || !Array.isArray(dokumente)) return false;
    return dokumente.some(doc => doc.kategorie === kategorie);
  };

  // Aufgaben für einen Fall prüfen
  const getFallTasks = (fall) => {
    if (!fall) return [];

    // Fallinformationen prüfen
    const allCaseInfoFilled = [
      // Mandantendaten
      fall.mandant?.vorname,
      fall.mandant?.nachname,
      fall.mandant?.telefon,
      fall.mandant?.email,
      fall.mandant?.geburtsdatum,
      fall.mandant?.adresse,
      // Schadensinformationen
      fall.schaden?.schadenstyp,
      fall.schaden?.schadensschwere,
      fall.schaden?.unfallort,
      fall.schaden?.unfallzeit,
      fall.schaden?.beschreibung,
      // Erste Partei
      fall.erstPartei?.vorname,
      fall.erstPartei?.nachname,
      fall.erstPartei?.versicherung,
      fall.erstPartei?.kennzeichen,
      fall.erstPartei?.kfzModell,
      fall.erstPartei?.fahrzeughalter,
      fall.erstPartei?.beteiligungsposition,
      // Zweite Partei
      fall.zweitPartei?.vorname,
      fall.zweitPartei?.nachname,
      fall.zweitPartei?.versicherung,
      fall.zweitPartei?.kennzeichen,
      fall.zweitPartei?.beteiligungsposition,
    ].every(isFilled);

    const tasks = [
      { label: 'Fallinformationen ausgefüllt', done: allCaseInfoFilled },
      { label: 'Datenschutzerklärung angenommen', done: fall.datenschutzAngenommen },
      { label: 'Führerschein hochgeladen', done: hasDokument(fall.dokumente, 'fuehrerschein_vorne') && hasDokument(fall.dokumente, 'fuehrerschein_hinten') },
      { label: 'Personalausweis hochgeladen', done: hasDokument(fall.dokumente, 'personalausweis_vorne') && hasDokument(fall.dokumente, 'personalausweis_hinten') },
      { label: 'KFZ Gutachten hochgeladen', done: hasDokument(fall.dokumente, 'kfz_gutachten') },
      { label: 'Fahrzeugschein hochgeladen', done: hasDokument(fall.dokumente, 'fahrzeugschein') },
      { label: 'Rechnungen hochgeladen', done: hasDokument(fall.dokumente, 'rechnungen') },
      { label: 'Unfallbericht hochgeladen', done: hasDokument(fall.dokumente, 'unfallbericht') },
    ];

    console.log('🔍 Aufgaben für Fall:', fall.fallname, tasks);
    return tasks;
  };

  // Offene Aufgaben für alle Fälle berechnen
  const getOffeneAufgaben = () => {
    const offeneAufgaben = cases.reduce((acc, fall) => {
      const tasks = getFallTasks(fall);
      const offeneTasks = tasks.filter(task => !task.done).length;
      console.log(`📊 Fall ${fall.fallname}: ${offeneTasks} offene Aufgaben`);
      return acc + offeneTasks;
    }, 0);

    console.log('📈 Gesamtzahl offener Aufgaben:', offeneAufgaben);
    return offeneAufgaben;
  };

  // Werte für den Kontext
  const value = {
    cases,
    currentCase,
    loading,
    error,
    filters,
    pagination,
    loadCases,
    getCaseById,
    createCase,
    updateCase,
    deleteCase,
    addCaseNote,
    setFilters,
    changePage,
    resetFilters,
    setError,
    getFallTasks,
    getOffeneAufgaben
  };

  // Globale Funktion für externen Refresh (z.B. nach Bearbeitung eines Falls)
  if (typeof window !== 'undefined') {
    window.refreshCasesGlobal = loadCases;
  }

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
};

// Hook für den einfachen Zugriff auf den Case-Kontext
export const useCase = () => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCase muss innerhalb eines CaseProviders verwendet werden');
  }
  return context;
};

export default CaseContext; 