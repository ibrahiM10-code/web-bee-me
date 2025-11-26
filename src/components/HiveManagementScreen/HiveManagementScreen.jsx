import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaHive,
  FaMapMarkerAlt,
  FaExpandAlt,
  FaRegTimesCircle,
  FaArrowLeft,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import "./HiveManagementScreen.css";
import ConfirmationModal from "../ConfirmationModal/ConfirmationModal";
import AlertMessage from "../AlertMessage/AlertMessage";
import ImageModal from "../ImageModal/ImageModal";
import axios from "axios";
import AuthContext from "../../context/AuthProvider";
import { API_URL } from "../../helpers/apiURL";

const HiveManagementScreen = () => {
  const [hives, setHives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingHive, setEditingHive] = useState(null);
  const [hiveName, setHiveName] = useState("");
  const [apiaryName, setApiaryName] = useState("");
  const [hiveImagePreview, setHiveImagePreview] = useState("");
  const [hiveImageFile, setHiveImageFile] = useState(null);
  const [hiveImageBase64, setHiveImageBase64] = useState("");

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [hiveToDelete, setHiveToDelete] = useState(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageToDisplayInModal, setImageToDisplayInModal] = useState("");
  const { userId, config } = useContext(AuthContext);

  const navigate = useNavigate();
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  const hiveRefs = useRef(new Map());

  // Función para cargar las colmenas desde la API (Centralizada)
  const fetchHives = async (showAlert = false) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/colmenas/obtener-colmenas/${userId}`,
        config
      );
      if (response.status === 200 && Array.isArray(response.data)) {
        setHives(response.data);
        console.log(response.data);
      } else {
        setHives([]);
      }
    } catch (error) {
      console.error("Error al cargar colmenas: ", error);
      setHives([]);
      if (hives.length === 0) {
        setAlert({
          message: "Error al cargar colmenas. Revisa la conexión.",
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Lógica de carga inicial de colmenas
  useEffect(() => {
    if (!config || !userId) {
      navigate("/login");
    }
    fetchHives();
  }, [config]);

  // Efecto para limpiar la URL blob:
  useEffect(() => {
    if (!config || !userId) return;
    return () => {
      if (hiveImagePreview && hiveImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(hiveImagePreview);
      }
    };
  }, [hiveImagePreview]);

  // Helpers para Refs
  const getHiveRef = (id) => {
    if (!hiveRefs.current.has(id)) {
      hiveRefs.current.set(id, React.createRef());
    }
    return hiveRefs.current.get(id);
  };

  const removeHiveRef = (id) => {
    hiveRefs.current.delete(id);
  };

  // Funciones de manejo de UI
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (hiveImagePreview && hiveImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(hiveImagePreview);
      }
      const objectUrl = URL.createObjectURL(file);
      setHiveImagePreview(objectUrl);
      setHiveImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHiveImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setHiveImagePreview("");
      setHiveImageFile(null);
      setHiveImageBase64("");
    }
  };

  const resetForm = () => {
    setEditingHive(null);
    setHiveName("");
    setApiaryName("");
    if (hiveImagePreview && hiveImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(hiveImagePreview);
    }
    setHiveImagePreview("");
    setHiveImageFile(null);
    setHiveImageBase64("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddHiveClick = () => {
    setAlert({ message: "", type: "" });
    resetForm();
    setShowForm(true);
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleDiscardImage = () => {
    if (hiveImagePreview && hiveImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(hiveImagePreview);
    }
    setHiveImagePreview("");
    setHiveImageFile(null);
    setHiveImageBase64("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setAlert({ message: "Imágen descartada.", type: "info" });
  };

  const handleDismissAlert = () => {
    setAlert({ message: "", type: "" });
  };

  const openImageModal = (imageSrc) => {
    setImageToDisplayInModal(imageSrc);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setImageToDisplayInModal("");
  };

  // --- FUNCIÓN DE GUARDAR (ADD/EDIT) ---
  const handleSaveHive = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ message: "", type: "" });

    if (!hiveName) {
      setAlert({
        message: "El nombre de la colmena es obligatorio.",
        type: "warning",
      });
      setLoading(false);
      return;
    }

    const newHiveData = new FormData();
    newHiveData.append("nombre_colmena", hiveName);
    newHiveData.append("nombre_apiario", apiaryName);
    newHiveData.append("id_apicultor", userId);

    if (hiveImageFile) {
      newHiveData.append("foto_colmena", hiveImageFile);
    }
    newHiveData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });
    try {
      let response;
      let successMessage = "";

      if (editingHive) {
        // Al editar, el backend debería aceptar el ID que se le envíe (sea _id o colmena_id)
        const hiveId = editingHive.colmena_id || editingHive._id;
        response = await axios.put(
          `${API_URL}/colmenas/actualizar-colmena/${hiveId}`,
          newHiveData,
          config
        );
        console.log("Response: ", response);
        if (response.status === 200) {
          successMessage = "¡Colmena actualizada con éxito!";
        }
      } else {
        response = await axios.post(
          `${API_URL}/colmenas/agregar-colmena`,
          newHiveData,
          config
        );
        if (response.status === 201) {
          successMessage = "¡Nueva colmena agregada con éxito!";
        }
      }

      if (successMessage) {
        await fetchHives();
        setAlert({ message: successMessage, type: "success" });
      }
    } catch (error) {
      console.error("Error al guardar la colmena: ", error);
      setAlert({
        message: `Error al guardar: ${
          error.response?.data?.message || error.message || "Error desconocido"
        }`,
        type: "error",
      });
    } finally {
      if (alert.type !== "success") setLoading(false);
      setShowForm(false);
      resetForm();
    }
  };

  const handleEditHive = (hive) => {
    setAlert({ message: "", type: "" });
    setEditingHive(hive);
    setHiveName(hive.nombre_colmena);
    setApiaryName(hive.nombre_apiario || "");
    setHiveImagePreview(hive.foto_colmena_url || "");
    setHiveImageFile(null);
    setShowForm(true);

    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const confirmDeleteHive = (hiveId) => {
    setAlert({ message: "", type: "" });
    setHiveToDelete(hiveId);
    setIsConfirmModalOpen(true);
  };

  // --- FUNCIÓN DE ELIMINAR CORREGIDA: ENVIANDO EL colmena_id ---
  const handleActualDeleteHive = async () => {
    if (!hiveToDelete) return;

    setLoading(true);
    setAlert({ message: "", type: "" });

    // Encontramos el objeto de la colmena por el hiveToDelete (que puede ser _id o colmena_id)
    const hiveObject = hives.find(
      (h) => (h._id || h.colmena_id) === hiveToDelete
    );

    // *** CORRECCIÓN CRÍTICA: PRIORIZAMOS el ID que el BACKEND ESPERA (colmena_id) ***
    const finalId = hiveObject?.colmena_id || hiveToDelete;

    if (!finalId) {
      setLoading(false);
      setAlert({
        message: "Error interno: ID de eliminación no encontrado.",
        type: "error",
      });
      return;
    }

    // 1. Cerrar el modal inmediatamente
    setIsConfirmModalOpen(false);
    setHiveToDelete(null);

    try {
      // Eliminación Optimista del estado local para la animación de salida
      setHives((prevHives) =>
        prevHives.filter((h) => (h.colmena_id || h._id) !== hiveToDelete)
      );
      removeHiveRef(hiveToDelete);

      // 2. Ejecutar la llamada a la API usando el 'finalId' (que es más probable que sea el colmena_id)
      const response = await axios.delete(
        `${API_URL}/colmenas/eliminar-colmena/${finalId}`,
        config
      );

      if (response.status === 200) {
        // 3. Recargar los datos para confirmar la eliminación y sincronizar
        await fetchHives();
        setAlert({ message: "Colmena eliminada con éxito.", type: "success" });
      } else {
        setAlert({
          message: "Eliminación reportada, pero la respuesta no fue 200.",
          type: "warning",
        });
        await fetchHives();
      }
    } catch (error) {
      console.error("Error al eliminar la colmena: ", error);

      await fetchHives();

      setAlert({
        message: `Error al eliminar: ${
          error.response?.data?.message || error.message || "Error desconocido"
        }`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setHiveToDelete(null);
    setAlert({ message: "Operación de eliminación cancelada.", type: "info" });
  };

  // --- Renderizado Condicional Mejorado ---
  if (loading && hives.length === 0) {
    return (
      <div className="loading-screen">
        <p>Cargando colmenas...</p>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="hive-management-screen-container">
      <nav className="hive-management-navbar">
        <Link to="/dashboard" className="nav-link">
          <FaArrowLeft /> Volver al Dashboard
        </Link>
      </nav>

      <div className="hive-management-content">
        <div className="hive-management-header-section">
          <FaHive className="hive-management-icon" />
          <div className="hive-management-title-group">
            <h1 className="hive-management-title">Gestión de Colmenas</h1>
            <p className="hive-management-subtitle">
              Añade, edita o elimina las colmenas de tu apiario.
            </p>
          </div>
          <button className="add-hive-button" onClick={handleAddHiveClick}>
            <FaPlus /> Añadir Nueva Colmena
          </button>
        </div>

        <AlertMessage
          message={alert.message}
          type={alert.type}
          onDismiss={handleDismissAlert}
        />

        <CSSTransition
          in={showForm}
          nodeRef={formRef}
          timeout={300}
          classNames="hive-form"
          unmountOnExit
        >
          <div className="hive-form-container" ref={formRef}>
            <h2 className="section-title">
              {editingHive ? "Editar Colmena" : "Añadir Nueva Colmena"}
            </h2>
            <form
              onSubmit={handleSaveHive}
              className="hive-form"
              encType="multipart/form-data"
            >
              <div className="form-group">
                <label htmlFor="hiveName">Nombre de la Colmena:</label>
                <input
                  type="text"
                  name="nombre_colmena"
                  id="hiveName"
                  placeholder={editingHive ? editingHive.nombre_colmena : ""}
                  value={hiveName}
                  onChange={(e) => setHiveName(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="apiaryName">Nombre del Apiario:</label>
                <input
                  type="text"
                  name="nombre_apiario"
                  id="apiaryName"
                  value={apiaryName}
                  placeholder={editingHive ? editingHive.nombre_apiario : ""}
                  onChange={(e) => setApiaryName(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group full-width file-input-group">
                <label htmlFor="hiveImageFile">Imagen de la Colmena:</label>
                <input
                  type="file"
                  id="hiveImageFile"
                  accept="image/*"
                  name="foto_colmena"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="form-input-file"
                />
                {(hiveImagePreview ||
                  (editingHive && editingHive.foto_colmena_url)) && (
                  <div className="image-preview">
                    <img
                      src={hiveImagePreview || editingHive.foto_colmena_url}
                      alt="Vista previa de la colmena"
                      className="form-image-preview"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://placehold.co/150x150/CCCCCC/000000?text=No+Image";
                      }}
                    />
                    <p className="image-preview-text">
                      {hiveImagePreview.startsWith("blob:")
                        ? "Imagen local seleccionada"
                        : "Imagen actual (URL)"}
                    </p>
                    <div className="image-preview-actions">
                      <button
                        type="button"
                        className="action-button expand-button"
                        onClick={() =>
                          openImageModal(
                            hiveImagePreview ||
                              (editingHive && editingHive.foto_colmena_url) ||
                              "https://placehold.co/150x150/CCCCCC/000000?text=No+Image"
                          )
                        }
                      >
                        <FaExpandAlt /> Ampliar
                      </button>
                      <button
                        type="button"
                        className="action-button discard-button"
                        onClick={handleDiscardImage}
                      >
                        <FaRegTimesCircle /> Descartar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? (
                    "Guardando..."
                  ) : (
                    <>
                      <FaSave /> Guardar Colmena
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  <FaTimes /> Cancelar
                </button>
              </div>
            </form>
          </div>
        </CSSTransition>

        <div className="hive-list-section">
          <h2 className="section-title">Tus Colmenas Registradas</h2>
          {hives.length === 0 && !showForm ? (
            <p className="no-hives-message">
              No tienes colmenas registradas. ¡Añade una!
            </p>
          ) : (
            <TransitionGroup className="hive-cards-grid">
              {hives.map((hive) => {
                // Usamos colmena_id como clave si existe, sino _id (para la UI)
                const hiveKey = hive.colmena_id || hive._id;

                if (!hiveKey) {
                  return null;
                }

                const cardRef = getHiveRef(hiveKey);

                return (
                  <CSSTransition
                    key={hiveKey}
                    timeout={400}
                    classNames="hive-card-transition"
                    nodeRef={cardRef}
                    onExited={() => removeHiveRef(hiveKey)}
                  >
                    <div className="hive-card" ref={cardRef}>
                      <div className="hive-card-image-container">
                        <img
                          src={
                            hive.foto_colmena_url
                              ? hive.foto_colmena_url
                              : "https://placehold.co/150x150/CCCCCC/000000?text=No+Image"
                          }
                          alt={`Colmena ${hive.nombre_colmena}`}
                          className="hive-card-image"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://placehold.co/150x150/CCCCCC/000000?text=No+Image";
                          }}
                        />
                        <div className="hive-card-image-overlay">
                          <button
                            className="expand-card-image-button"
                            onClick={() =>
                              openImageModal(
                                hive.foto_colmena_url ||
                                  "https://placehold.co/150x150/CCCCCC/000000?text=No+Image"
                              )
                            }
                          >
                            <FaExpandAlt />
                          </button>
                        </div>
                      </div>
                      <h3>
                        <FaHive /> {hive.nombre_colmena}
                      </h3>
                      <p>
                        <FaMapMarkerAlt /> Apiario: {hive.nombre_apiario}
                      </p>
                      <div className="hive-card-actions">
                        <button
                          className="edit-button"
                          onClick={() => handleEditHive(hive)}
                        >
                          <FaEdit /> Editar
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => confirmDeleteHive(hiveKey)}
                        >
                          <FaTrash /> Eliminar
                        </button>
                      </div>
                      <Link
                        to={`/colmena/${hiveKey}`}
                        className="view-detail-link"
                      >
                        Ver Detalles
                      </Link>
                    </div>
                  </CSSTransition>
                );
              })}
            </TransitionGroup>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleActualDeleteHive}
        title="Confirmar Eliminación"
        message={
          hiveToDelete
            ? `Estás a punto de eliminar la colmena "${
                hives.find((h) => (h.colmena_id || h.colmena_id) === hiveToDelete)
                  ?.nombre_colmena || "..."
              }". Esta acción es irreversible.`
            : "¿Estás seguro de que quieres eliminar este elemento? Esta acción es irreversible."
        }
      />

      <ImageModal
        isOpen={isImageModalOpen}
        imageUrl={imageToDisplayInModal}
        onClose={closeImageModal}
      />
    </div>
  );
};

export default HiveManagementScreen;
