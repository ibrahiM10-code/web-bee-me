import React, { useState, useEffect, useContext, useMemo } from "react";
import "./DashboardScreen.css";
import {
  FaHive,
  FaBell,
  FaFileAlt,
  FaCog,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";
import { GiBee } from "react-icons/gi";
import {
  MdOutlineThermostat,
  MdOutlineWaterDrop,
  MdOutlineScale,
  MdAnalytics,
} from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../../context/AuthProvider";
import { API_URL } from "../../helpers/apiURL";
// Importaciones de Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// --- HOOK DE SIMULACIÓN (Sin cambios funcionales en simulación) ---
const useSimulatedHistoricalData = (avgMetrics) => {
  const { avgTemp, avgHum, avgWeight } = avgMetrics;
  return useMemo(() => {
    const tempHistory = [];
    const humHistory = [];
    const weightHistory = [];

    const baseTemp = avgTemp > 0 ? avgTemp : 35.0;
    const baseHum = avgHum > 0 ? avgHum : 60.0;
    const baseWeight = avgWeight > 0 ? avgWeight : 50.0;

    // Genera datos para las últimas 24 horas
    for (let i = 23; i >= 0; i--) {
      const hour = (new Date().getHours() - i + 24) % 24;
      const timeLabel = `${hour.toString().padStart(2, "0")}:00`;

      const temp =
        baseTemp +
        Math.sin((hour / 24) * 2 * Math.PI) * 1.5 +
        (Math.random() - 0.5) * 0.5;
      const hum =
        baseHum +
        Math.cos((hour / 24) * 2 * Math.PI) * 5.0 +
        (Math.random() - 0.5) * 2.0;
      const weight =
        baseWeight +
        Math.sin((hour / 24) * 2 * Math.PI + Math.PI / 2) * 0.5 +
        (Math.random() - 0.5) * 0.3;

      tempHistory.push({
        time: timeLabel,
        Temperatura: parseFloat(temp.toFixed(1)),
      });
      humHistory.push({ time: timeLabel, Humedad: parseFloat(hum.toFixed(1)) });
      weightHistory.push({
        time: timeLabel,
        Peso: parseFloat(weight.toFixed(1)),
      });
    }

    return { tempHistory, humHistory, weightHistory };
  }, [avgTemp, avgHum, avgWeight]);
};
// ------------------------------------------------------------------------------------

// --- NUEVO COMPONENTE: BARRA DE SELECCIÓN DE GRÁFICOS (Sin cambios) ---
const TrendSelectorBar = ({ activeTrend, setActiveTrend }) => {
  const trendOptions = [
    { key: "Global", name: "Global (Actual)", icon: MdAnalytics },
    { key: "Temperatura", name: "Tendencia Temp.", icon: MdOutlineThermostat },
    { key: "Humedad", name: "Tendencia Hum.", icon: MdOutlineWaterDrop },
    { key: "Peso", name: "Tendencia Peso.", icon: MdOutlineScale },
  ];

  return (
    <div className="trend-selector-bar-floating">
      {trendOptions.map((option) => (
        <button
          key={option.key}
          className={`trend-button ${
            activeTrend === option.key ? "active" : ""
          }`}
          onClick={() => setActiveTrend(option.key)}
          title={option.name}
        >
          <option.icon className="trend-icon" />
          <span className="trend-name">{option.name}</span>
        </button>
      ))}
    </div>
  );
};
// -----------------------------------------------------------------

// --- COMPONENTE BASE PARA UN GRÁFICO DE LÍNEAS ÚNICO (Tendencias) ---
const SingleMetricTrendChart = ({
  data,
  dataKey,
  name,
  unit,
  strokeColor,
  domain,
}) => (
  <div className="trend-chart-container">
    <h2 className="section-title chart-title">
      <MdAnalytics /> Tendencia de {name} (24h)
    </h2>
    <p className="chart-subtitle">Evolución de la métrica promedio.</p>
    <div className="chart-area-full">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={data}
            // ******* MARGEN IZQUIERDO AJUSTADO A 60 *******
            margin={{ top: 20, right: 30, left: 60, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              interval={3}
              angle={0}
              textAnchor="middle"
              height={30}
              style={{ fontSize: "10px" }}
            />
            <YAxis
              unit={unit}
              stroke={strokeColor}
              domain={domain}
              tickFormatter={(tick) => tick.toFixed(1)}
              // Ajuste opcional del label, offset -15 para moverlo a la izquierda
              label={{
                value: `${name} (${unit})`,
                angle: -90,
                position: "insideLeft",
                fill: strokeColor,
                offset: -15,
              }}
            />
            <Tooltip
              formatter={(value) => [`${value.toFixed(1)} ${unit}`, name]}
              labelFormatter={(label) => `Hora: ${label}`}
              contentStyle={{ borderRadius: "8px", border: "none" }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="top"
              align="center"
              wrapperStyle={{ paddingTop: "10px" }}
            />

            <Line
              type="monotone"
              dataKey={dataKey}
              name={name}
              stroke={strokeColor}
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="modal-no-data">Cargando datos históricos de {name}...</p>
      )}
    </div>
  </div>
);
// ------------------------------------------------------------------------------------

// --- COMPONENTE DE GRÁFICO GLOBAL DE BARRAS ---
const GlobalChart = ({ chartData, totalColonies }) => (
  <div className="trend-chart-container">
    <h2 className="section-title chart-title">
      <MdAnalytics /> Análisis Comparativo Global (Actual)
    </h2>
    <p className="chart-subtitle">
      Comparación de métricas de las {totalColonies} Colmenas
    </p>

    <div className="chart-area-full">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            // ******* MARGEN IZQUIERDO AJUSTADO A 60 *******
            margin={{ top: 20, right: 30, left: 60, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="name"
              interval={0}
              angle={0}
              textAnchor="middle"
              height={30}
              style={{ fontSize: "10px" }}
            />
            <YAxis />
            <Tooltip
              formatter={(value, name) => [
                `${value.toFixed(1)} ${
                  name === "Peso" ? "kg" : name === "Humedad" ? "%" : "°C"
                }`,
                name,
              ]}
              contentStyle={{ borderRadius: "8px", border: "none" }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="top"
              align="center"
              wrapperStyle={{ paddingTop: "10px" }}
            />
            <Bar dataKey="Temperatura" fill="#ff9800" />
            <Bar dataKey="Humedad" fill="#2196f3" />
            <Bar dataKey="Peso" fill="#4caf50" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="modal-no-data">No hay datos disponibles para graficar.</p>
      )}
    </div>
  </div>
);
// ------------------------------------------------------------------------------------

// --- Componente re-utilizable: AverageMetricWidget (Sin cambios) ---
const AverageMetricWidget = ({ icon: Icon, value, label, unit, className }) => (
  <div className={`summary-widget average-metric ${className}`}>
    <Icon className="widget-icon" />
    <span className="widget-value">{value}</span>
    <span className="widget-label">
      {label} {unit}
    </span>
  </div>
);

// --- COMPONENTE: AlertButtonWidget (Sin cambios) ---
const AlertButtonWidget = ({ count, onClick, id }) => {
  const isAlert = count > 0;
  // Utilizamos un estilo de card más ancho para esta sección
  const className = `alert-summary-card ${
    isAlert ? "active-alerts" : "no-alerts"
  }`;
  const Icon = isAlert ? FaExclamationTriangle : FaBell;
  const label = isAlert
    ? `¡Atención! Hay ${count} Alertas Activas`
    : "Todas las Colmenas en orden";

  return (
    <div className={className} onClick={isAlert ? onClick : null} id={id}>
      <div className="card-content-wrapper">
        <Icon className="widget-icon" />
        <div className="alert-details">
          <span className="alert-label">{label}</span>
          {isAlert && (
            <span className="alert-action-text">
              Clic para ver detalles en las {count} alertas.
            </span>
          )}
        </div>
        {isAlert && (
          <button className="view-alerts-button" onClick={onClick}>
            Ver Alertas
          </button>
        )}
      </div>
    </div>
  );
};
// --------------------------------------------------------------------

// --- Componente re-utilizable: ColonySummaryCard (MODIFICADO) ---
const ColonySummaryCard = ({
  name,
  id,
  temperature,
  humidity,
  weight,
  lastUpdated,
}) => {
  // LÓGICA DE ESTADO JERÁRQUICA: Crítica > Alerta > Saludable
  const getStatusClass = () => {
    // --- UMBRALES IDEALES/ALERTA (para referencia) ---
    // Temp Ideal: [32, 36] °C
    // Hum Ideal: [50, 75] %
    // Peso Ideal: >= 40 kg

    // --- UMBRALES CRÍTICOS (FUERA DE LOS RANGOS DE TRABAJO SEGURO) ---
    const isCriticalTemp = temperature < 30 || temperature > 38;
    // Humedad crítica: Fuera de [40, 90]
    const isCriticalHum = humidity < 40 || humidity > 90;
    // Peso crítico: 30kg o menos
    const isCriticalWeight = weight < 30;

    // 1. CHEQUEO CRÍTICO (Prioridad más alta)
    if (isCriticalTemp || isCriticalHum || isCriticalWeight) {
      return "colony-status-critical";
    }

    // 2. CHEQUEO ALERTA (Prioridad media, si no es crítico)
    // Temperatura en rangos de advertencia [30, 32) o (36, 38]
    const isAlertTemp =
      (temperature >= 30 && temperature < 32) ||
      (temperature > 36 && temperature <= 38);

    // Humedad fuera del rango ideal [50, 75], pero dentro del rango crítico [40, 90]
    const isAlertHum =
      (humidity >= 40 && humidity < 50) || (humidity > 75 && humidity <= 90);

    // Peso bajo (< 40 kg), pero no crítico
    const isLowWeight = weight >= 30 && weight < 40;

    if (isAlertTemp || isAlertHum || isLowWeight) {
      return "colony-status-alert";
    }

    // 3. ESTADO PREDETERMINADO (Saludable)
    return "colony-status-ok";
  };

  const currentStatusClass = getStatusClass();

  const getStatusText = (statusClass) => {
    switch (statusClass) {
      case "colony-status-ok":
        return "Saludable";
      case "colony-status-alert":
        return "En Alerta";
      case "colony-status-critical":
        return "Crítica";
      default:
        return "Desconocido";
    }
  };

  // NUEVA LÓGICA: Determina el color del icono de la campana
  const getBellColor = (statusClass) => {
    switch (statusClass) {
      case "colony-status-critical":
        return "#e74c3c"; // Rojo para Crítico
      case "colony-status-alert":
        return "#f1c40f"; // Amarillo para Alerta
      default:
        return "transparent"; // Ocultar/no mostrar color si está OK
    }
  };

  const bellColor = getBellColor(currentStatusClass);
  const isBellVisible = currentStatusClass !== "colony-status-ok";

  return (
    <Link to={`/colmena/${id}`} className="colony-card-link">
      <div className={`colony-summary-card ${currentStatusClass}`}>
        <div className="card-header">
          <FaHive className="hive-icon" />
          <h3 className="colony-name">{name}</h3>
          {/* LÓGICA MODIFICADA PARA MOSTRAR Y ASIGNAR COLOR AL ÍCONO DE ALERTA */}
          {isBellVisible && (
            <FaBell
              className="alert-bell-icon"
              style={{ color: bellColor }} // Aplica el color dinámicamente
            />
          )}
          {/* FIN LÓGICA MODIFICADA */}
        </div>
        <div className="card-body">
          <div className={`status-display ${currentStatusClass}`}>
            <span className="status-icon">
              {currentStatusClass === "colony-status-ok" ? "✓" : "⚠️"}
            </span>
            <span className="status-text">
              {getStatusText(currentStatusClass)}
            </span>
          </div>
          <div className="metrics-summary">
            <div className="metric-item">
              <MdOutlineThermostat />
              <span>{temperature ? temperature.toFixed(1) : "N/A"}°C</span>
            </div>
            <div className="metric-item">
              <MdOutlineWaterDrop />
              <span>{humidity ? humidity.toFixed(1) : "N/A"}%</span>
            </div>
            <div className="metric-item">
              <MdOutlineScale />
              <span>{weight ? weight.toFixed(1) : "N/A"} kg</span>
            </div>
          </div>
          <p className="last-updated">Actualizado: {lastUpdated}</p>
        </div>
      </div>
    </Link>
  );
};

// --- Helper para formatear datos para el gráfico de barras (Sin cambios) ---
const formatDataForChart = (colmenas) => {
  if (!colmenas || colmenas.length === 0) return [];

  return colmenas.map((colmena) => ({
    name: colmena.nombre_colmena,
    Temperatura: colmena.temperatura || 0,
    Humedad: colmena.humedad || 0,
    Peso: colmena.peso || 0,
  }));
};
// -----------------------------------------------------------

// --- NUEVO COMPONENTE: Botón Flotante (Sin cambios) ---
const FloatingAlertButton = ({ count, onClick }) => {
  if (count === 0) return null;

  return (
    <button
      className="floating-alert-btn"
      onClick={onClick}
      title={`Ver ${count} alertas activas`}
    >
      <FaExclamationTriangle />
      <span className="alert-count-tag-floating"> {count}</span>
      <span className="alert-text-floating"> ¡Alertas!</span>
    </button>
  );
};
// -----------------------------------------------------------

// --- Componente principal: DashboardScreen ---
const DashboardScreen = () => {
  const [colmenas, setColmenas] = useState([]);
  const { config, userId } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState("N/A");
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [activeAlertsData, setActiveAlertsData] = useState([]);
  const nav = useNavigate();

  const [activeTrend, setActiveTrend] = useState("Global");

  // ... (funciones getColmenas sin cambios) ...
  const getColmenas = async (isInitialLoad = false) => {

    if (isInitialLoad) {
      setLoading(true);
    }
    try {
      const response = await axios.get(
        `${API_URL}/colmenas/obtener-colmenas/${userId}`,
        config
      );
      if (response.status === 200) {
        setColmenas(response.data);
        setLastUpdatedTime(new Date().toLocaleTimeString());
      } else if (response.status === 204) {
        console.log("No hay colmenas registradas en la base de datos.");
        setColmenas([]);
      }
    } catch (error) {
      console.error("Error al obtener colmenas: ", error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  // --- LÓGICA DE ALERTA MODIFICADA (Cambio de 'Low' a 'Medium') ---
  const allAlertsData = useMemo(() => {
    return colmenas
      .map((colmena) => {
        let alerts = [];

        // --- UMBRALES CRÍTICOS ---
        const isCriticalTemp =
          colmena.temperatura < 30 || colmena.temperatura > 38;
        const isCriticalHum = colmena.humedad < 40 || colmena.humedad > 90;
        const isCriticalWeight = colmena.peso < 30;

        // --- UMBRALES DE ALERTA (no críticos) ---
        const isAlertTemp =
          (colmena.temperatura >= 30 && colmena.temperatura < 32) ||
          (colmena.temperatura > 36 && colmena.temperatura <= 38);
        const isAlertHum =
          (colmena.humedad >= 40 && colmena.humedad < 50) ||
          (colmena.humedad > 75 && colmena.humedad <= 90);
        const isLowWeight = colmena.peso >= 30 && colmena.peso < 40;

        if (isCriticalTemp) {
          alerts.push({
            type: "Temperatura Crítica",
            value: colmena.temperatura + "°C",
            severity: "Critical",
          });
        } else if (isAlertTemp) {
          alerts.push({
            type: "Temperatura Anormal",
            value: colmena.temperatura + "°C",
            severity: "Medium",
          });
        }

        if (isCriticalHum) {
          alerts.push({
            type: "Humedad Crítica",
            value: colmena.humedad + "%",
            severity: "Critical",
          });
        } else if (isAlertHum) {
          alerts.push({
            type: "Humedad Anormal",
            value: colmena.humedad + "%",
            severity: "Medium",
          });
        }

        if (isCriticalWeight) {
          alerts.push({
            type: "Peso Crítico (Muy Bajo)",
            value: colmena.peso + "kg",
            severity: "Critical",
          });
        }
        // AQUI ESTÁ LA MODIFICACIÓN: Cambiar 'Low' por 'Medium'
        else if (isLowWeight) {
          alerts.push({
            type: "Peso Bajo",
            value: colmena.peso + "kg",
            severity: "Medium",
          });
        }
        // --------------------------------------------------------

        return {
          id: colmena.colmena_id,
          name: colmena.nombre_colmena,
          alerts: alerts,
        };
      })
      .filter((c) => c.alerts.length > 0);
  }, [colmenas]);

  useEffect(() => {
    const activeAlerts = allAlertsData.filter((c) => c.alerts.length > 0);
    setActiveAlertsData(activeAlerts);
  }, [allAlertsData]);

  useEffect(() => {
    if (!config || !userId) {
      nav("/login");
    } else {
        getColmenas(true);
        const intervalId = setInterval(() => {
          getColmenas(false);
        }, 3000);
        return () => clearInterval(intervalId);
    }
  }, [config, userId]);

  // --- Cálculos de Resumen y Promedios (Sin cambios) ---
  const totalColonies = colmenas.length;
  const activeAlertsCount = activeAlertsData.reduce(
    (sum, colmena) => sum + colmena.alerts.length,
    0
  );

  const avgMetrics = useMemo(() => {
    if (totalColonies === 0) return { avgTemp: 0, avgHum: 0, avgWeight: 0 };

    const totalTemp = colmenas.reduce(
      (sum, c) => sum + (c.temperatura || 0),
      0
    );
    const totalHum = colmenas.reduce((sum, c) => sum + (c.humedad || 0), 0);
    const totalWeight = colmenas.reduce((sum, c) => sum + (c.peso || 0), 0);

    return {
      avgTemp: totalTemp / totalColonies,
      avgHum: totalHum / totalColonies,
      avgWeight: totalWeight / totalColonies,
    };
  }, [colmenas, totalColonies]);

  const { avgTemp, avgHum, avgWeight } = avgMetrics;

  // --- Datos para Gráfico de Barras ---
  const chartData = formatDataForChart(colmenas);

  // --- Datos para Gráficos de Línea ---
  const historicalData = useSimulatedHistoricalData(avgMetrics);
  // ------------------------------------

  const openAlertsModal = () => {
    if (activeAlertsCount > 0) {
      setIsAlertsModalOpen(true);
    } else {
      // Este caso es menos probable ya que el botón no debería ser clickable
      console.log("No hay alertas activas para abrir el modal.");
    }
  };
  const closeAlertsModal = () => {
    setIsAlertsModalOpen(false);
  };

  // -------------------------------------------------------------
  // FUNCIÓN PARA EL SCROLL SUAVE (Sin cambios)
  // -------------------------------------------------------------
  const scrollToAlertsWidget = () => {
    const alertsWidget = document.getElementById("alerts-widget");
    if (alertsWidget) {
      alertsWidget.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Opcional: Destacar el widget brevemente
      alertsWidget.classList.add("highlight-alert-flash");
      setTimeout(() => {
        alertsWidget.classList.remove("highlight-alert-flash");
      }, 1500);
    }
  };
  // -------------------------------------------------------------

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <GiBee className="loading-bee" size={50} color="#ff9800" />
        <p>Cargando datos iniciales...</p>
      </div>
    );
  }

  // --- LÓGICA DE RENDERIZADO DEL GRÁFICO ACTIVO (Sin cambios) ---
  const renderActiveTrendChart = () => {
    switch (activeTrend) {
      case "Global":
        return (
          <GlobalChart chartData={chartData} totalColonies={totalColonies} />
        );
      case "Temperatura":
        return (
          <SingleMetricTrendChart
            data={historicalData.tempHistory}
            dataKey="Temperatura"
            name="Temperatura"
            unit="°C"
            strokeColor="#e74c3c"
            domain={[32, 38]}
          />
        );
      case "Humedad":
        return (
          <SingleMetricTrendChart
            data={historicalData.humHistory}
            dataKey="Humedad"
            name="Humedad"
            unit="%"
            strokeColor="#2196f3"
            domain={[40, 80]}
          />
        );
      case "Peso":
        return (
          <SingleMetricTrendChart
            data={historicalData.weightHistory}
            dataKey="Peso"
            name="Peso"
            unit="kg"
            strokeColor="#4caf50"
            domain={["dataMin - 1", "dataMax + 1"]}
          />
        );
      default:
        return null;
    }
  };
  // -------------------------------------------------------------

  return (
    <div className="dashboard-screen-container">
      <nav className="dashboard-navbar">
        <div className="navbar-logo">
          <GiBee className="nav-bee-icon" />
          <span>Monitor Beehive</span>
        </div>
        <div className="navbar-links">
          <Link to="/reports" className="nav-link">
            <FaFileAlt /> Reportes
          </Link>
          <Link to="/settings" className="nav-link">
            <FaCog /> Configuración
          </Link>
          <Link to="/hives" className="nav-link">
            <FaHive /> Gestionar Colmenas
          </Link>
          <Link to="/logout" className="nav-link logout-link">
            <FaSignOutAlt /> Cerrar Sesión
          </Link>
        </div>
      </nav>

      <div className="dashboard-content">
        <h1 className="dashboard-title">Resumen del Apiario</h1>

        {/* 1. SECCIÓN DE GRÁFICOS */}
        <section className="section-trend-visualization-flow">
          <div className="active-chart-display-full">
            {renderActiveTrendChart()}
          </div>
          <TrendSelectorBar
            activeTrend={activeTrend}
            setActiveTrend={setActiveTrend}
          />
        </section>
        <hr className="section-separator" />

        {/* 2. CUADRANTES DE PROMEDIOS */}
        <h2 className="section-title">Promedios de Métricas Globales</h2>
        <div className="global-summary-widgets metrics-only-grid">
          <AverageMetricWidget
            icon={MdOutlineThermostat}
            value={avgTemp.toFixed(1)}
            label="Temperatura Promedio"
            unit="°C"
            className="temp-avg"
          />

          <AverageMetricWidget
            icon={MdOutlineWaterDrop}
            value={avgHum.toFixed(1)}
            label="Humedad Promedio"
            unit="%"
            className="hum-avg"
          />

          <AverageMetricWidget
            icon={MdOutlineScale}
            value={avgWeight.toFixed(1)}
            label="Peso Promedio"
            unit="kg"
            className="weight-avg"
          />
        </div>
        {/* ------------------------------------------------------------------ */}

        <hr className="section-separator" />

        {/* WIDGET DE ALERTA: ID para el scroll */}
        <AlertButtonWidget
          id="alerts-widget" /* <-- ID AÑADIDO AQUI */
          count={activeAlertsCount}
          onClick={openAlertsModal}
        />
        <h2 className="section-title">Mis Colmenas</h2>
        <div className="colonies-grid">
          {colmenas.map((colmena) => (
            <ColonySummaryCard
              key={colmena.colmena_id}
              id={colmena.colmena_id}
              name={colmena.nombre_colmena}
              temperature={colmena.temperatura}
              humidity={colmena.humedad}
              weight={colmena.peso}
              lastUpdated={lastUpdatedTime}
            />
          ))}
        </div>
      </div>

      {/* NUEVO COMPONENTE: BOTÓN FLOTANTE */}
      <FloatingAlertButton
        count={activeAlertsCount}
        onClick={scrollToAlertsWidget}
      />

      {/* [MODAL DE ALERTAS] (Sin cambios) */}
      {isAlertsModalOpen && (
        <div className="alerts-modal-overlay" onClick={closeAlertsModal}>
          <div
            className="alerts-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-button" onClick={closeAlertsModal}>
              <FaTimes />
            </button>
            <h2 className="modal-title-alerts">
              <FaBell /> Alertas Activas ({activeAlertsCount} Total)
            </h2>
            <p className="modal-subtitle-alerts">
              Revisa los parámetros fuera de rango en tus colmenas.
            </p>

            <div className="alerts-list-container">
              {activeAlertsData.length > 0 ? (
                activeAlertsData.map((colmenaAlert) => (
                  <div key={colmenaAlert.id} className="colmena-alerts-group">
                    <h3 className="colmena-alert-name">
                      <FaHive /> {colmenaAlert.name}
                      <span className="alert-count-tag">
                        {colmenaAlert.alerts.length} alertas
                      </span>
                    </h3>
                    <div className="alert-items-grid">
                      {colmenaAlert.alerts.map((alert, index) => (
                        <div
                          key={index}
                          className={`alert-item-card alert-${alert.severity.toLowerCase()}`}
                        >
                          <div className="card-severity-icon">
                            <FaExclamationTriangle />
                          </div>
                          <div className="card-details">
                            <span className="card-alert-type">
                              {alert.type}
                            </span>
                            <span className="card-alert-value">
                              Valor: {alert.value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {activeAlertsData.indexOf(colmenaAlert) <
                      activeAlertsData.length - 1 && (
                      <hr className="colmena-separator" />
                    )}
                  </div>
                ))
              ) : (
                <p className="modal-no-data">
                  ¡Felicidades! No hay alertas activas en este momento.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardScreen;
