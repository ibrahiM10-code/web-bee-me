import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../../context/AuthProvider";
import { Link } from "react-router-dom";
import {
  FaCog,
  FaBell,
  FaThermometerHalf,
  FaWeightHanging,
  FaTint,
  FaUserCircle,
  FaSave,
  FaArrowLeft,
} from "react-icons/fa";
import "./SettingsScreen.css";
import axios from "axios";
import { API_URL } from "../../helpers/apiURL";

const SettingsScreen = () => {
  // Estado para los umbrales de alerta
  const [minTempThreshold, setMinTempThreshold] = useState(35.0);
  const [maxTempThreshold, setMaxTempThreshold] = useState(38.0);
  const [minHumidityThreshold, setMinHumidityThreshold] = useState(50.0);
  const [maxHumidityThreshold, setMaxHumidityThreshold] = useState(75.0);
  const [minWeightThreshold, setMinWeightThreshold] = useState(30.0);
  const [maxWeightThreshold, setMaxWeightThreshold] = useState(45.0);

  // Estado para las preferencias de notificación
  const [notifyTemp, setNotifyTemp] = useState(true);
  const [notifyHumidity, setNotifyHumidity] = useState(true);
  const [notifyWeight, setNotifyWeight] = useState(true);
  const [notifyActivity, setNotifyActivity] = useState(false);

  // Estado para simular la carga y el guardado
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { config, userId } = useContext(AuthContext);
  const [umbrales, setUmbrales] = useState(null);

  const fetchUmbrales = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/umbrales/obtener-umbrales/${userId}`,
        config
      );
      console.log("STATUS: ", response.status);
      if (response.status === 204) {
        setUmbrales([
          {
            temperatura_minima: 32,
            temperatura_maxima: 36,
            humedad_minima: 50,
            humedad_maxima: 70,
            peso_minimo: 20,
            peso_maximo: 40,
          },
        ]);
      } else if (response.status === 200) {
        const umbralesCorrectos = response.data.filter(
          (item) => item.id_apicultor_admin === userId
        );
        console.log(userId);
        console.log(response.data);
        console.log("UMBRALES CORRECTOS: ", umbralesCorrectos);
        setUmbrales(umbralesCorrectos);
      }
    } catch (error) {
      console.error("ERROR: ", error);
    }
  };

  // call fetchUmbrales when provider config or userId changes
  useEffect(() => {
    if (userId && config) {
      fetchUmbrales();
    } else {
      return;
    }
  }, [userId, config]);

  // when `umbrales` arrives, populate the threshold states
  useEffect(() => {
    setLoading(true);
    if (!umbrales || umbrales.length === 0) return;
    const u = umbrales[0]; // use first item (adjust if backend returns different shape)
    if (!u) return;
    setTimeout(() => {
      setMinTempThreshold(
        typeof u.temperatura_minima === "number"
          ? u.temperatura_minima
          : parseFloat(u.temperatura_minima) || minTempThreshold
      );
      setMaxTempThreshold(
        typeof u.temperatura_maxima === "number"
          ? u.temperatura_maxima
          : parseFloat(u.temperatura_maxima) || maxTempThreshold
      );
      setMinHumidityThreshold(
        typeof u.humedad_minima === "number"
          ? u.humedad_minima
          : parseFloat(u.humedad_minima) || minHumidityThreshold
      );
      setMaxHumidityThreshold(
        typeof u.humedad_maxima === "number"
          ? u.humedad_maxima
          : parseFloat(u.humedad_maxima) || maxHumidityThreshold
      );
      setMinWeightThreshold(
        typeof u.peso_minimo === "number"
          ? u.peso_minimo
          : parseFloat(u.peso_minimo) || minWeightThreshold
      );
      setMaxWeightThreshold(
        typeof u.peso_maximo === "number"
          ? u.peso_maximo
          : parseFloat(u.peso_maximo) || maxWeightThreshold
      );
      setNotifyTemp(true);
      setNotifyHumidity(true);
      setNotifyWeight(true);
      setNotifyActivity(false);
      setLoading(false);
    }, 500);
  }, [umbrales]);

  // useEffect(() => {
  //   setLoading(true);
  //   setTimeout(() => {
  //     setMinTempThreshold(36.0);
  //     setMaxTempThreshold(39.0);
  //     setMinHumidityThreshold(60.0);
  //     setMaxHumidityThreshold(80.0);
  //     setMinWeightThreshold(32.0);
  //     setMaxWeightThreshold(40.0);
  //     setNotifyTemp(true);
  //     setNotifyHumidity(true);
  //     setNotifyWeight(true);
  //     setNotifyActivity(false);
  //     setLoading(false);
  //   }, 500);
  // }, []);

  const handleUmbrales = async (
    temperatura_minima,
    temperatura_maxima,
    humedad_minima,
    humedad_maxima,
    peso_minimo,
    peso_maximo
  ) => {
    const nuevosUmbrales = {
      temperatura_minima,
      temperatura_maxima,
      humedad_maxima,
      humedad_minima,
      peso_maximo,
      peso_minimo,
    };
    try {
      const response = await axios.post(
        `${API_URL}/umbrales/agregar-umbrales/${userId}`,
        nuevosUmbrales,
        config
      );
      if (response.status === 200) {
        alert("Actualizacion correcta!");
      } else if (response.status === 204) {
        const responseActualizar = await axios.put(
          `${API_URL}/umbrales/actualizar-umbrales/${userId}`,
          nuevosUmbrales,
          config
        );
        if (responseActualizar.status === 200) {
          alert("Actualizacion correcta!");
        } else if (response.status === 204) {
          alert("Nada se ha actualizado.");
        }
      }
    } catch (error) {
      console.error("ERROR: ", error);
    }
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    handleUmbrales(
      minTempThreshold,
      maxTempThreshold,
      minHumidityThreshold,
      maxHumidityThreshold,
      minWeightThreshold,
      maxWeightThreshold
    );
    setTimeout(() => {
      console.log("Configuraciones guardadas:");
      console.log("Temperatura Min.:", minTempThreshold);
      console.log("Temperatura Máx.:", maxTempThreshold);
      console.log("Humedad Min.:", minHumidityThreshold);
      console.log("Humedad Máx.:", maxHumidityThreshold);
      console.log("Peso Mín.:", minWeightThreshold);
      console.log("Peso Máx.:", maxWeightThreshold);
      console.log("Notificar Temp:", notifyTemp);
      console.log("Notificar Humedad:", notifyHumidity);
      console.log("Notificar Peso:", notifyWeight);
      console.log("Notificar Actividad:", notifyActivity);

      setMessage("¡Configuraciones guardadas con éxito!");
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Cargando configuraciones...</p>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="settings-screen-container">
      <nav className="settings-navbar">
        <Link to="/dashboard" className="nav-link">
          <FaArrowLeft /> Volver al Dashboard
        </Link>
      </nav>
      <div className="settings-content">
        <div className="settings-header-section">
          <FaCog className="settings-icon" />
          <div className="settings-title-group">
            <h1 className="settings-title">Configuración de la Aplicación</h1>
            <p className="settings-subtitle">
              Gestiona tus preferencias y umbrales de alerta.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`message-banner ${
              message.includes("éxito") ? "success" : "error"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSaveChanges} className="settings-form">
          <div className="settings-section">
            <h2 className="section-title">
              <FaBell /> Notificaciones y Alertas
            </h2>
            <div className="form-group-grid">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="notifyTemp"
                  checked={notifyTemp}
                  onChange={(e) => setNotifyTemp(e.target.checked)}
                />
                <label htmlFor="notifyTemp">
                  Notificar Temperatura Anormal
                </label>
              </div>
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="notifyHumidity"
                  checked={notifyHumidity}
                  onChange={(e) => setNotifyHumidity(e.target.checked)}
                />
                <label htmlFor="notifyHumidity">
                  Notificar Humedad Anormal
                </label>
              </div>
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="notifyWeight"
                  checked={notifyWeight}
                  onChange={(e) => setNotifyWeight(e.target.checked)}
                />
                <label htmlFor="notifyWeight">
                  Notificar Variación de Peso
                </label>
              </div>
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="notifyActivity"
                  checked={notifyActivity}
                  onChange={(e) => setNotifyActivity(e.target.checked)}
                />
                <label htmlFor="notifyActivity">
                  Notificar Actividad Anormal
                </label>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2 className="section-title">Umbrales de Alerta Personalizados</h2>
            <div className="form-group-grid">
              <div className="form-group threshold-group">
                <label>
                  <FaThermometerHalf /> Temperatura (°C):
                </label>
                <div className="input-range">
                  <div className="input-field-wrapper">
                    <label htmlFor="minTempThreshold">Mín.</label>
                    <input
                      type="number"
                      id="minTempThreshold"
                      value={minTempThreshold}
                      onChange={(e) =>
                        setMinTempThreshold(parseFloat(e.target.value))
                      }
                      step="0.1"
                      className="setting-input"
                      placeholder="Mín."
                    />
                  </div>
                  <div className="input-field-wrapper">
                    <label htmlFor="maxTempThreshold">Máx.</label>
                    <input
                      type="number"
                      id="maxTempThreshold"
                      value={maxTempThreshold}
                      onChange={(e) =>
                        setMaxTempThreshold(parseFloat(e.target.value))
                      }
                      step="0.1"
                      className="setting-input"
                      placeholder="Máx."
                    />
                  </div>
                </div>
              </div>
              <div className="form-group threshold-group">
                <label>
                  <FaTint /> Humedad (%):
                </label>
                <div className="input-range">
                  <div className="input-field-wrapper">
                    <label htmlFor="minHumidityThreshold">Mín.</label>
                    <input
                      type="number"
                      id="minHumidityThreshold"
                      value={minHumidityThreshold}
                      onChange={(e) =>
                        setMinHumidityThreshold(parseFloat(e.target.value))
                      }
                      step="0.1"
                      className="setting-input"
                      placeholder="Mín."
                    />
                  </div>
                  <div className="input-field-wrapper">
                    <label htmlFor="maxHumidityThreshold">Máx.</label>
                    <input
                      type="number"
                      id="maxHumidityThreshold"
                      value={maxHumidityThreshold}
                      onChange={(e) =>
                        setMaxHumidityThreshold(parseFloat(e.target.value))
                      }
                      step="0.1"
                      className="setting-input"
                      placeholder="Máx."
                    />
                  </div>
                </div>
              </div>
              <div className="form-group threshold-group">
                <label>
                  <FaWeightHanging /> Peso (kg):
                </label>
                <div className="input-range">
                  <div className="input-field-wrapper">
                    <label htmlFor="minWeightThreshold">Mín.</label>
                    <input
                      type="number"
                      id="minWeightThreshold"
                      value={minWeightThreshold}
                      onChange={(e) =>
                        setMinWeightThreshold(parseFloat(e.target.value))
                      }
                      step="0.1"
                      className="setting-input"
                      placeholder="Mín."
                    />
                  </div>
                  <div className="input-field-wrapper">
                    <label htmlFor="maxWeightThreshold">Máx.</label>
                    <input
                      type="number"
                      id="maxWeightThreshold"
                      value={maxWeightThreshold}
                      onChange={(e) =>
                        setMaxWeightThreshold(parseFloat(e.target.value))
                      }
                      step="0.1"
                      className="setting-input"
                      placeholder="Máx."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2 className="section-title">
              <FaUserCircle /> Información del Perfil
            </h2>
            <p className="profile-info-text">
              Aquí se podría integrar la edición de tu información personal o
              del apiario. (Funcionalidad no implementada en este ejemplo, pero
              fácilmente expandible).
            </p>
          </div>

          <button
            type="submit"
            className="save-settings-button"
            disabled={loading}
          >
            {loading ? (
              "Guardando..."
            ) : (
              <>
                <FaSave /> Guardar Cambios
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsScreen;
