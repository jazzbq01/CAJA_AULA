import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate, useParams } from "react-router-dom"

const BUCKET_COMPROBANTES = "tesoreria-comprobantes_items"
const MAX_FILE_SIZE_MB = 10

export default function TesoreriaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [actividad, setActividad] = useState(null)
  const [items, setItems] = useState([])
  const [archivos, setArchivos] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [descripcion, setDescripcion] = useState("")
  const [tipo, setTipo] = useState("INGRESO")
  const [categoria, setCategoria] = useState("CUOTA_PADRE")
  const [cantidad, setCantidad] = useState("1")
  const [monto, setMonto] = useState("")

  const [modalArchivo, setModalArchivo] = useState(null)
  const [archivoFile, setArchivoFile] = useState(null)
  const [archivoTipo, setArchivoTipo] = useState("BOLETA")
  const [archivoObservacion, setArchivoObservacion] = useState("")
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)

  /* =========================
     ✅ RESPONSIVE
  ========================= */
  const getWindowWidth = () => {
    if (typeof window === "undefined") return 1200
    return window.innerWidth
  }

  const [anchoPantalla, setAnchoPantalla] = useState(getWindowWidth())

  useEffect(() => {
    const handleResize = () => {
      setAnchoPantalla(getWindowWidth())
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const esMovil = anchoPantalla < 640
  const esTablet = anchoPantalla >= 640 && anchoPantalla < 1024
  const esDesktop = anchoPantalla >= 1024

  const columnasInfoHeader = esMovil
    ? "1fr"
    : esTablet
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(4, minmax(0, 1fr))"

  const columnasFormulario = esMovil
    ? "1fr"
    : esTablet
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(auto-fit, minmax(220px, 1fr))"

  const columnasMeta = esMovil
    ? "1fr"
    : esTablet
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(auto-fit, minmax(160px, 1fr))"

  const load = async () => {
    setLoading(true)

    const { data: act, error: actError } = await supabase
      .from("tesoreria_actividades")
      .select("*")
      .eq("id", id)
      .single()

    if (actError) {
      console.error("Error al cargar actividad:", actError)
      alert("No se pudo cargar la actividad")
      setLoading(false)
      return
    }

    const { data: it, error: itError } = await supabase
      .from("tesoreria_items")
      .select("*")
      .eq("actividad_id", id)
      .order("created_at", { ascending: false })

    if (itError) {
      console.error("Error al cargar detalles:", itError)
      alert("No se pudieron cargar los detalles")
    }

    const { data: archivosData, error: archivosError } = await supabase
      .from("tesoreria_item_archivos")
      .select("*")
      .eq("actividad_id", id)
      .order("created_at", { ascending: false })

    if (archivosError) {
      console.error("Error al cargar archivos:", archivosError)
    }

    setActividad(act)
    setItems(it || [])
    setArchivos(archivosData || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])

  const calcularSaldo = (listaItems) => {
    return listaItems.reduce((total, item) => {
      if (item.afecta_saldo === false) return total

      const subtotal = Number(item.subtotal || 0)

      if (item.tipo === "INGRESO") return total + subtotal
      if (item.tipo === "GASTO") return total - subtotal

      return total
    }, 0)
  }

  const formatoCategoria = (categoria) => {
    const nombres = {
      CUOTA_PADRE: "Cuota de padre",
      DONACION: "Donación",
      ACTIVIDAD: "Actividad",
      COMPRA: "Compra",
      SERVICIO: "Servicio",
      CAJA_CHICA: "Caja chica",
      OTROS: "Otros"
    }

    return nombres[categoria] || categoria
  }

  const formatoTipoArchivo = (tipoArchivo) => {
    const nombres = {
      BOLETA: "Boleta",
      FACTURA: "Factura",
      RECIBO: "Recibo",
      VOUCHER: "Voucher",
      OTRO: "Otro"
    }

    return nombres[tipoArchivo] || tipoArchivo
  }

  const formatoFechaHora = (fecha) => {
    if (!fecha) return "Sin fecha"

    return new Date(fecha).toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getArchivosItem = (itemId) => {
    return archivos.filter((archivo) => archivo.item_id === itemId)
  }

  const limpiarFormulario = () => {
    setDescripcion("")
    setTipo("INGRESO")
    setCategoria("CUOTA_PADRE")
    setCantidad("1")
    setMonto("")
  }

  const agregarItem = async () => {
    if (!actividad) return

    if (actividad.estado === "FINALIZADO") {
      alert("Esta actividad ya está finalizada")
      return
    }

    if (!descripcion.trim()) {
      alert("Ingrese la descripción del detalle")
      return
    }

    if (Number(cantidad) <= 0) {
      alert("Ingrese una cantidad válida")
      return
    }

    if (Number(monto) <= 0) {
      alert("Ingrese un monto unitario válido")
      return
    }

    const cantidadNumero = Number(cantidad)
    const montoNumero = Number(monto)
    const subtotal = cantidadNumero * montoNumero

    const nuevoItem = {
      actividad_id: id,
      descripcion: descripcion.trim(),
      tipo,
      categoria,
      cantidad: cantidadNumero,
      precio_unitario: montoNumero,
      subtotal,
      afecta_saldo: categoria !== "CAJA_CHICA"
    }

    console.log("Intentando guardar item:", nuevoItem)

    setGuardando(true)

    const { error } = await supabase
      .from("tesoreria_items")
      .insert([nuevoItem])

    setGuardando(false)

    if (error) {
      console.error("Error exacto de Supabase:", error)
      alert(`No se pudo guardar el detalle: ${error.message}`)
      return
    }

    limpiarFormulario()
    load()
  }

  const eliminarItem = async (itemId) => {
    if (actividad?.estado === "FINALIZADO") {
      alert("No se puede eliminar un detalle de una actividad finalizada")
      return
    }

    const confirmar = confirm("¿Deseas eliminar este detalle?")
    if (!confirmar) return

    const archivosDelItem = getArchivosItem(itemId)

    if (archivosDelItem.length > 0) {
      const paths = archivosDelItem
        .map((archivo) => archivo.archivo_path)
        .filter(Boolean)

      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET_COMPROBANTES)
          .remove(paths)

        if (storageError) {
          console.error("Error al eliminar archivos del Storage:", storageError)
          alert(`No se pudieron eliminar los archivos: ${storageError.message}`)
          return
        }
      }
    }

    const { error } = await supabase
      .from("tesoreria_items")
      .delete()
      .eq("id", itemId)

    if (error) {
      console.error("Error al eliminar detalle:", error)
      alert(`No se pudo eliminar: ${error.message}`)
      return
    }

    load()
  }

  const finalizarActividad = async () => {
    if (!actividad) return

    if (items.length === 0) {
      alert("No puedes finalizar una actividad sin detalles registrados")
      return
    }

    const confirmar = confirm(
      "Al finalizar la actividad ya no podrás agregar, editar ni eliminar detalles. ¿Deseas continuar?"
    )

    if (!confirmar) return

    let totalIngresos = 0
    let totalGastos = 0
    let totalCajaChica = 0

    items.forEach((item) => {
      const subtotal = Number(item.subtotal || 0)

      if (item.tipo === "INGRESO") {
        totalIngresos += subtotal
      }

      if (item.tipo === "GASTO" && item.categoria !== "CAJA_CHICA") {
        totalGastos += subtotal
      }

      if (item.categoria === "CAJA_CHICA") {
        totalCajaChica += subtotal
      }
    })

    const saldoFinal = totalIngresos - totalGastos

    const { error } = await supabase
      .from("tesoreria_actividades")
      .update({
        estado: "FINALIZADO",
        fecha_fin: new Date().toISOString(),
        total_ingresos: totalIngresos,
        total_gastos: totalGastos,
        total_caja_chica: totalCajaChica,
        saldo_final: saldoFinal,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) {
      console.error("Error al finalizar:", error)
      alert(`No se pudo finalizar: ${error.message}`)
      return
    }

    load()
  }

  const abrirModalArchivo = (item) => {
    if (actividad?.estado === "FINALIZADO") {
      alert("No se pueden agregar archivos a una actividad finalizada")
      return
    }

    setModalArchivo(item)
    setArchivoFile(null)
    setArchivoTipo("BOLETA")
    setArchivoObservacion("")
  }

  const cerrarModalArchivo = () => {
    setModalArchivo(null)
    setArchivoFile(null)
    setArchivoTipo("BOLETA")
    setArchivoObservacion("")
    setSubiendoArchivo(false)
  }

  const limpiarNombreArchivo = (nombre) => {
    return nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9.-]/g, "")
  }

  const subirArchivoItem = async () => {
    if (!modalArchivo) return

    if (actividad?.estado === "FINALIZADO") {
      alert("No se pueden agregar archivos a una actividad finalizada")
      return
    }

    if (!archivoFile) {
      alert("Seleccione un archivo")
      return
    }

    const sizeMb = archivoFile.size / 1024 / 1024

    if (sizeMb > MAX_FILE_SIZE_MB) {
      alert(`El archivo no debe superar ${MAX_FILE_SIZE_MB} MB`)
      return
    }

    try {
      setSubiendoArchivo(true)

      const extension = archivoFile.name.split(".").pop() || "archivo"
      const nombreLimpio = limpiarNombreArchivo(archivoFile.name)

      const filePath = `actividades/${id}/items/${modalArchivo.id}/${Date.now()}-${
        nombreLimpio || `comprobante.${extension}`
      }`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_COMPROBANTES)
        .upload(filePath, archivoFile, {
          cacheControl: "3600",
          upsert: false
        })

      if (uploadError) {
        console.error("Error al subir archivo:", uploadError)
        alert(`No se pudo subir el archivo: ${uploadError.message}`)
        setSubiendoArchivo(false)
        return
      }

      const { data } = supabase.storage
        .from(BUCKET_COMPROBANTES)
        .getPublicUrl(filePath)

      const publicUrl = data.publicUrl

      const { error: insertError } = await supabase
        .from("tesoreria_item_archivos")
        .insert([
          {
            item_id: modalArchivo.id,
            actividad_id: id,
            tipo_archivo: archivoTipo,
            nombre_archivo: archivoFile.name,
            archivo_url: publicUrl,
            archivo_path: filePath,
            mime_type: archivoFile.type || null,
            size_bytes: archivoFile.size,
            observacion: archivoObservacion.trim() || null
          }
        ])

      if (insertError) {
        console.error("Error al guardar archivo en tabla:", insertError)
        alert(`El archivo subió, pero no se guardó el registro: ${insertError.message}`)
        setSubiendoArchivo(false)
        return
      }

      setSubiendoArchivo(false)
      cerrarModalArchivo()
      load()
    } catch (error) {
      setSubiendoArchivo(false)
      console.error("Error general al subir archivo:", error)
      alert(`No se pudo subir el archivo: ${error.message}`)
    }
  }

  const eliminarArchivoItem = async (archivo) => {
    if (actividad?.estado === "FINALIZADO") {
      alert("No se pueden eliminar archivos de una actividad finalizada")
      return
    }

    const confirmar = confirm("¿Deseas eliminar este archivo?")
    if (!confirmar) return

    if (archivo.archivo_path) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET_COMPROBANTES)
        .remove([archivo.archivo_path])

      if (storageError) {
        console.error("Error al eliminar archivo del Storage:", storageError)
        alert(`No se pudo eliminar el archivo del Storage: ${storageError.message}`)
        return
      }
    }

    const { error } = await supabase
      .from("tesoreria_item_archivos")
      .delete()
      .eq("id", archivo.id)

    if (error) {
      console.error("Error al eliminar archivo de tabla:", error)
      alert(`No se pudo eliminar el registro del archivo: ${error.message}`)
      return
    }

    load()
  }

  if (loading) {
    return (
      <div
        style={{
          ...styles.container,
          padding: esMovil ? 12 : esTablet ? 16 : 20,
          boxSizing: "border-box"
        }}
      >
        Cargando detalle...
      </div>
    )
  }

  if (!actividad) {
    return (
      <div
        style={{
          ...styles.container,
          padding: esMovil ? 12 : esTablet ? 16 : 20,
          boxSizing: "border-box"
        }}
      >
        <h2>Actividad no encontrada</h2>
        <button
          style={{
            ...styles.backBtn,
            width: esMovil ? "100%" : "auto"
          }}
          onClick={() => navigate("/tesoreria")}
        >
          ← Volver a Tesorería
        </button>
      </div>
    )
  }

  const estaFinalizada = actividad.estado === "FINALIZADO"
  const saldoActual = estaFinalizada
    ? Number(actividad.saldo_final || 0)
    : calcularSaldo(items)

  const subtotalPreview =
    Number(cantidad || 0) > 0 && Number(monto || 0) > 0
      ? Number(cantidad) * Number(monto)
      : 0

  const getTipoStyle = (tipo) => {
    return tipo === "INGRESO"
      ? {
          label: "Ingreso",
          color: "#16a34a",
          background: "#dcfce7",
          border: "#86efac",
          signo: "+"
        }
      : {
          label: "Gasto",
          color: "#dc2626",
          background: "#fee2e2",
          border: "#fecaca",
          signo: "-"
        }
  }

  return (
    <div
      style={{
        ...styles.container,
        padding: esMovil ? 12 : esTablet ? 16 : 20,
        boxSizing: "border-box",
        overflowX: "hidden"
      }}
    >

      <div
        style={{
          ...styles.pageWrapper,
          maxWidth: esDesktop ? 1200 : "100%",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box"
        }}
      >

        <button
          style={{
            ...styles.backBtn,
            width: esMovil ? "100%" : "auto",
            minHeight: esMovil ? 42 : "auto"
          }}
          onClick={() => navigate("/tesoreria")}
        >
          ← Volver
        </button>

        <section
          style={{
            ...styles.headerCard,
            flexDirection: esMovil || esTablet ? "column" : "row",
            alignItems: esMovil || esTablet ? "stretch" : "center",
            padding: esMovil ? 14 : esTablet ? 18 : 22,
            boxSizing: "border-box"
          }}
        >
          <div
            style={{
              minWidth: 0,
              width: "100%"
            }}
          >
            <h1
              style={{
                ...styles.title,
                fontSize: esMovil ? 22 : esTablet ? 25 : 28,
                lineHeight: 1.2,
                wordBreak: "break-word",
                margin: esMovil ? "0 0 14px 0" : "0 0 18px 0"
              }}
            >
              💳 {actividad.nombre}
            </h1>

            <div
              style={{
                ...styles.infoGrid,
                display: "grid",
                gridTemplateColumns: columnasInfoHeader,
                gap: esMovil ? 10 : 14
              }}
            >
              <div style={styles.headerInfoBox}>
                <span style={styles.labelText}>Estado</span>
                <p style={styles.valueText}>
                  <b style={{ color: estaFinalizada ? "#16a34a" : "#d97706" }}>
                    {actividad.estado || "BORRADOR"}
                  </b>
                </p>
              </div>

              <div style={styles.headerInfoBox}>
                <span style={styles.labelText}>Saldo actual</span>
                <p style={styles.valueText}>
                  <b>S/ {saldoActual.toFixed(2)}</b>
                </p>
              </div>

              <div style={styles.headerInfoBox}>
                <span style={styles.labelText}>Total de detalles</span>
                <p style={styles.valueText}>
                  <b>{items.length}</b>
                </p>
              </div>

              <div style={styles.headerInfoBox}>
                <span style={styles.labelText}>Archivos adjuntos</span>
                <p style={styles.valueText}>
                  <b>{archivos.length}</b>
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              ...styles.headerActions,
              width: esMovil || esTablet ? "100%" : "auto"
            }}
          >
            {!estaFinalizada && (
              <button
                style={{
                  ...styles.finalizarBtn,
                  width: esMovil || esTablet ? "100%" : "auto",
                  minHeight: esMovil ? 42 : "auto"
                }}
                onClick={finalizarActividad}
              >
                🔒 Finalizar actividad
              </button>
            )}
          </div>
        </section>

        {!estaFinalizada && (
          <section
            style={{
              ...styles.formCard,
              padding: esMovil ? 14 : 18,
              boxSizing: "border-box"
            }}
          >
            <h2
              style={{
                ...styles.sectionTitle,
                fontSize: esMovil ? 18 : 20,
                lineHeight: 1.2
              }}
            >
              Agregar detalle de tesorería
            </h2>

            <div style={styles.field}>
              <label style={styles.label}>Descripción del detalle</label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ejemplo: Cuota Día de la Madre"
                style={{
                  ...styles.input,
                  width: "100%",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div
              style={{
                ...styles.row,
                gridTemplateColumns: columnasFormulario
              }}
            >
              <div style={styles.field}>
                <label style={styles.label}>Tipo de movimiento</label>
                <select
                  value={tipo}
                  onChange={(e) => {
                    setTipo(e.target.value)
                    setCategoria(e.target.value === "INGRESO" ? "CUOTA_PADRE" : "COMPRA")
                  }}
                  style={{
                    ...styles.input,
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                >
                  <option value="INGRESO">Ingreso</option>
                  <option value="GASTO">Gasto</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Categoría</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  style={{
                    ...styles.input,
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                >
                  {tipo === "INGRESO" && (
                    <>
                      <option value="CUOTA_PADRE">Cuota de padre</option>
                      <option value="DONACION">Donación</option>
                      <option value="ACTIVIDAD">Actividad</option>
                      <option value="OTROS">Otros ingresos</option>
                    </>
                  )}

                  {tipo === "GASTO" && (
                    <>
                      <option value="COMPRA">Compra</option>
                      <option value="SERVICIO">Servicio</option>
                      <option value="CAJA_CHICA">Caja chica</option>
                      <option value="OTROS">Otros gastos</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div
              style={{
                ...styles.row,
                gridTemplateColumns: columnasFormulario
              }}
            >
              <div style={styles.field}>
                <label style={styles.label}>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="Ejemplo: 1"
                  style={{
                    ...styles.input,
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Monto unitario</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Ejemplo: 10.00"
                  style={{
                    ...styles.input,
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Subtotal</label>
                <input
                  value={`S/ ${subtotalPreview.toFixed(2)}`}
                  disabled
                  style={{
                    ...styles.input,
                    background: "#f8fafc",
                    fontWeight: "bold",
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            <div
              style={{
                ...styles.formFooter,
                justifyContent: esMovil ? "stretch" : "flex-end"
              }}
            >
              <button
                onClick={agregarItem}
                disabled={guardando}
                style={{
                  ...styles.addBtn,
                  width: esMovil ? "100%" : "auto",
                  minHeight: esMovil ? 42 : "auto",
                  opacity: guardando ? 0.7 : 1,
                  cursor: guardando ? "not-allowed" : "pointer"
                }}
              >
                {guardando ? "Guardando..." : "➕ Agregar detalle"}
              </button>
            </div>
          </section>
        )}

        <section style={styles.listSection}>
          <div
            style={{
              ...styles.listHeader,
              flexDirection: esMovil ? "column" : "row",
              alignItems: esMovil ? "flex-start" : "center"
            }}
          >
            <div>
              <h2
                style={{
                  ...styles.sectionTitle,
                  fontSize: esMovil ? 18 : 20,
                  lineHeight: 1.2
                }}
              >
                Detalles registrados
              </h2>
              <p
                style={{
                  ...styles.listSubtitle,
                  fontSize: esMovil ? 13 : 14,
                  lineHeight: 1.4
                }}
              >
                Movimientos asociados a esta actividad de tesorería.
              </p>
            </div>

            <div
              style={{
                ...styles.counterBadge,
                alignSelf: esMovil ? "flex-start" : "center"
              }}
            >
              {items.length} registro{items.length === 1 ? "" : "s"}
            </div>
          </div>

          {items.length === 0 && (
            <div style={styles.empty}>
              Esta actividad todavía no tiene detalles registrados.
            </div>
          )}

          <div style={styles.itemsList}>
            {items.map((item) => {
              const tipoStyle = getTipoStyle(item.tipo)
              const subtotal = Number(item.subtotal || 0)
              const precioUnitario = Number(item.precio_unitario || 0)
              const noAfectaSaldo = item.afecta_saldo === false
              const archivosItem = getArchivosItem(item.id)

              return (
                <div
                  key={item.id}
                  style={{
                    ...styles.itemCard,
                    flexDirection: esMovil ? "column" : "row"
                  }}
                >

                  <div
                    style={{
                      ...styles.itemAccent,
                      background: tipoStyle.color,
                      width: esMovil ? "100%" : 7,
                      height: esMovil ? 7 : "auto"
                    }}
                  />

                  <div
                    style={{
                      ...styles.itemContent,
                      padding: esMovil ? 14 : 16
                    }}
                  >

                    <div
                      style={{
                        ...styles.itemTop,
                        flexDirection: esMovil ? "column" : "row",
                        alignItems: esMovil ? "stretch" : "flex-start"
                      }}
                    >
                      <div
                        style={{
                          ...styles.itemMainInfo,
                          width: "100%"
                        }}
                      >
                        <h3
                          style={{
                            ...styles.itemTitle,
                            fontSize: esMovil ? 16 : 18,
                            lineHeight: 1.25
                          }}
                        >
                          {item.descripcion || "Sin descripción"}
                        </h3>

                        <div style={styles.badgeRow}>
                          <span
                            style={{
                              ...styles.tipoBadge,
                              color: tipoStyle.color,
                              background: tipoStyle.background,
                              borderColor: tipoStyle.border
                            }}
                          >
                            {tipoStyle.label}
                          </span>

                          <span style={styles.categoriaBadge}>
                            {formatoCategoria(item.categoria)}
                          </span>

                          {noAfectaSaldo && (
                            <span style={styles.noSaldoBadge}>
                              No afecta saldo
                            </span>
                          )}

                          {archivosItem.length > 0 && (
                            <span style={styles.archivoCountBadge}>
                              📎 {archivosItem.length} archivo{archivosItem.length === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          ...styles.amountBox,
                          width: esMovil ? "100%" : "auto",
                          textAlign: esMovil ? "left" : "right",
                          boxSizing: "border-box"
                        }}
                      >
                        <span style={styles.amountLabel}>Subtotal</span>
                        <strong
                          style={{
                            ...styles.amountValue,
                            color: tipoStyle.color,
                            fontSize: esMovil ? 18 : 20
                          }}
                        >
                          {tipoStyle.signo} S/ {subtotal.toFixed(2)}
                        </strong>
                      </div>
                    </div>

                    <div
                      style={{
                        ...styles.itemMetaGrid,
                        gridTemplateColumns: columnasMeta
                      }}
                    >
                      <div style={styles.metaBox}>
                        <span style={styles.metaLabel}>Cantidad</span>
                        <b style={styles.metaValue}>{item.cantidad}</b>
                      </div>

                      <div style={styles.metaBox}>
                        <span style={styles.metaLabel}>Monto unitario</span>
                        <b style={styles.metaValue}>
                          S/ {precioUnitario.toFixed(2)}
                        </b>
                      </div>

                      <div style={styles.metaBox}>
                        <span style={styles.metaLabel}>Categoría original</span>
                        <b
                          style={{
                            ...styles.metaValue,
                            wordBreak: "break-word"
                          }}
                        >
                          {item.categoria}
                        </b>
                      </div>
                    </div>

                    <div style={styles.archivosBox}>
                      <div
                        style={{
                          ...styles.archivosHeader,
                          flexDirection: esMovil ? "column" : "row",
                          alignItems: esMovil ? "stretch" : "center"
                        }}
                      >
                        <b>Comprobantes / sustentos</b>

                        {!estaFinalizada && (
                          <button
                            style={{
                              ...styles.smallAttachBtn,
                              width: esMovil ? "100%" : "auto",
                              minHeight: esMovil ? 38 : "auto"
                            }}
                            onClick={() => abrirModalArchivo(item)}
                          >
                            📎 Agregar archivo
                          </button>
                        )}
                      </div>

                      {archivosItem.length === 0 && (
                        <p style={styles.noFilesText}>
                          No hay archivos adjuntos para este detalle.
                        </p>
                      )}

                      {archivosItem.length > 0 && (
                        <div style={styles.archivosList}>
                          {archivosItem.map((archivo) => (
                            <div
                              key={archivo.id}
                              style={{
                                ...styles.archivoItem,
                                flexDirection: esMovil ? "column" : "row",
                                alignItems: esMovil ? "stretch" : "center"
                              }}
                            >
                              <div
                                style={{
                                  ...styles.archivoInfo,
                                  width: "100%"
                                }}
                              >
                                <span style={styles.archivoTipoBadge}>
                                  {formatoTipoArchivo(archivo.tipo_archivo)}
                                </span>

                                <a
                                  href={archivo.archivo_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={styles.archivoLink}
                                >
                                  {archivo.nombre_archivo}
                                </a>

                                <span style={styles.archivoFecha}>
                                  {formatoFechaHora(archivo.created_at)}
                                </span>

                                {archivo.observacion && (
                                  <p style={styles.archivoObs}>
                                    {archivo.observacion}
                                  </p>
                                )}
                              </div>

                              {!estaFinalizada && (
                                <button
                                  style={{
                                    ...styles.deleteFileBtn,
                                    width: esMovil ? "100%" : "auto",
                                    minHeight: esMovil ? 38 : "auto"
                                  }}
                                  onClick={() => eliminarArchivoItem(archivo)}
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {!estaFinalizada && (
                    <div
                      style={{
                        ...styles.itemActions,
                        flexDirection: esMovil ? "row" : "column",
                        width: esMovil ? "100%" : "auto",
                        padding: esMovil ? "0 14px 14px" : "0 14px",
                        borderLeft: esMovil ? "none" : "1px solid #f1f5f9",
                        borderTop: esMovil ? "1px solid #f1f5f9" : "none",
                        boxSizing: "border-box"
                      }}
                    >
                      <button
                        style={{
                          ...styles.attachBtn,
                          flex: esMovil ? 1 : "initial",
                          minHeight: esMovil ? 40 : "auto"
                        }}
                        onClick={() => abrirModalArchivo(item)}
                      >
                        📎 Archivo
                      </button>

                      <button
                        style={{
                          ...styles.deleteBtn,
                          flex: esMovil ? 1 : "initial",
                          minHeight: esMovil ? 40 : "auto"
                        }}
                        onClick={() => eliminarItem(item.id)}
                      >
                        🗑 Eliminar
                      </button>
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        </section>

        {modalArchivo && (
          <div
            style={{
              ...styles.overlay,
              padding: esMovil ? 12 : 20
            }}
          >
            <div
              style={{
                ...styles.modal,
                padding: esMovil ? 16 : 22,
                maxHeight: esMovil ? "92vh" : "auto",
                overflowY: esMovil ? "auto" : "visible"
              }}
            >
              <h2
                style={{
                  ...styles.modalTitle,
                  fontSize: esMovil ? 20 : 22,
                  lineHeight: 1.2
                }}
              >
                Agregar comprobante
              </h2>

              <p
                style={{
                  ...styles.modalSubtitle,
                  lineHeight: 1.4
                }}
              >
                Detalle: <b>{modalArchivo.descripcion}</b>
              </p>

              <div style={styles.field}>
                <label style={styles.label}>Tipo de archivo</label>
                <select
                  value={archivoTipo}
                  onChange={(e) => setArchivoTipo(e.target.value)}
                  style={{
                    ...styles.input,
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                >
                  <option value="BOLETA">Boleta</option>
                  <option value="FACTURA">Factura</option>
                  <option value="RECIBO">Recibo</option>
                  <option value="VOUCHER">Voucher</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Archivo</label>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setArchivoFile(e.target.files?.[0] || null)}
                  style={{
                    ...styles.input,
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                />

                {archivoFile && (
                  <p style={styles.fileHelp}>
                    Archivo seleccionado: <b>{archivoFile.name}</b>
                  </p>
                )}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Observación</label>
                <input
                  value={archivoObservacion}
                  onChange={(e) => setArchivoObservacion(e.target.value)}
                  placeholder="Ejemplo: Boleta por compra de materiales"
                  style={{
                    ...styles.input,
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div
                style={{
                  ...styles.modalActions,
                  flexDirection: esMovil ? "column" : "row"
                }}
              >
                <button
                  onClick={subirArchivoItem}
                  disabled={subiendoArchivo}
                  style={{
                    ...styles.addBtn,
                    width: esMovil ? "100%" : "auto",
                    minHeight: esMovil ? 42 : "auto",
                    opacity: subiendoArchivo ? 0.7 : 1,
                    cursor: subiendoArchivo ? "not-allowed" : "pointer"
                  }}
                >
                  {subiendoArchivo ? "Subiendo archivo..." : "Guardar archivo"}
                </button>

                <button
                  onClick={cerrarModalArchivo}
                  disabled={subiendoArchivo}
                  style={{
                    ...styles.cancelBtn,
                    width: esMovil ? "100%" : "auto",
                    minHeight: esMovil ? 42 : "auto",
                    opacity: subiendoArchivo ? 0.7 : 1,
                    cursor: subiendoArchivo ? "not-allowed" : "pointer"
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  )
}

const styles = {
  container: {
    padding: 20,
    fontFamily: "Arial",
    background: "#f4f6fb",
    minHeight: "100vh"
  },

  pageWrapper: {
    width: "100%"
  },

  backBtn: {
    background: "#64748b",
    color: "white",
    border: "none",
    padding: "9px 14px",
    borderRadius: 8,
    cursor: "pointer",
    marginBottom: 16
  },

  headerCard: {
    background: "white",
    borderRadius: 16,
    padding: 22,
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
    marginBottom: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20
  },

  headerActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap"
  },

  title: {
    margin: "0 0 18px 0",
    fontSize: 28
  },

  infoGrid: {
    display: "flex",
    gap: 35,
    flexWrap: "wrap"
  },

  headerInfoBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "10px 12px",
    boxSizing: "border-box"
  },

  labelText: {
    fontSize: 13,
    color: "#64748b"
  },

  valueText: {
    margin: "4px 0 0",
    fontSize: 17
  },

  finalizarBtn: {
    background: "#111827",
    color: "white",
    border: "none",
    padding: "12px 16px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold"
  },

  formCard: {
    background: "white",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
    marginBottom: 22
  },

  sectionTitle: {
    margin: 0,
    fontSize: 20
  },

  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14
  },

  field: {
    display: "flex",
    flexDirection: "column",
    marginBottom: 14
  },

  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#334155"
  },

  input: {
    padding: "11px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: 15
  },

  formFooter: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 6
  },

  addBtn: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold"
  },

  cancelBtn: {
    background: "#64748b",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold"
  },

  listSection: {
    marginTop: 20
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12
  },

  listSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: 14
  },

  counterBadge: {
    background: "#e0ecff",
    color: "#1d4ed8",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: "bold",
    whiteSpace: "nowrap"
  },

  empty: {
    background: "white",
    padding: 18,
    borderRadius: 12,
    color: "#64748b",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },

  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },

  itemCard: {
    position: "relative",
    background: "white",
    borderRadius: 16,
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.07)",
    display: "flex",
    overflow: "hidden",
    border: "1px solid #e2e8f0"
  },

  itemAccent: {
    width: 7,
    flexShrink: 0
  },

  itemContent: {
    flex: 1,
    padding: 16,
    minWidth: 0
  },

  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 15
  },

  itemMainInfo: {
    minWidth: 0
  },

  itemTitle: {
    margin: "0 0 8px 0",
    fontSize: 18,
    color: "#0f172a",
    wordBreak: "break-word"
  },

  badgeRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
  },

  tipoBadge: {
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "bold",
    border: "1px solid"
  },

  categoriaBadge: {
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "bold",
    color: "#334155",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0"
  },

  noSaldoBadge: {
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "bold",
    color: "#92400e",
    background: "#fef3c7",
    border: "1px solid #fde68a"
  },

  archivoCountBadge: {
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "bold",
    color: "#1d4ed8",
    background: "#dbeafe",
    border: "1px solid #bfdbfe"
  },

  amountBox: {
    minWidth: 155,
    textAlign: "right",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "10px 12px"
  },

  amountLabel: {
    display: "block",
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4
  },

  amountValue: {
    fontSize: 20
  },

  itemMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 10,
    marginTop: 14
  },

  metaBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "10px 12px"
  },

  metaLabel: {
    display: "block",
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4
  },

  metaValue: {
    color: "#0f172a",
    fontSize: 14
  },

  archivosBox: {
    marginTop: 14,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    borderRadius: 14,
    padding: 12
  },

  archivosHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 8
  },

  smallAttachBtn: {
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "7px 10px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 12
  },

  noFilesText: {
    margin: 0,
    color: "#64748b",
    fontSize: 13
  },

  archivosList: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },

  archivoItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 10
  },

  archivoInfo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    minWidth: 0
  },

  archivoTipoBadge: {
    color: "#0f172a",
    background: "#e2e8f0",
    border: "1px solid #cbd5e1",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 12,
    fontWeight: "bold"
  },

  archivoLink: {
    color: "#2563eb",
    fontWeight: "bold",
    fontSize: 14,
    wordBreak: "break-word"
  },

  archivoFecha: {
    color: "#64748b",
    fontSize: 12
  },

  archivoObs: {
    width: "100%",
    margin: "4px 0 0",
    color: "#475569",
    fontSize: 13
  },

  deleteFileBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "7px 10px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "nowrap"
  },

  itemActions: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 8,
    padding: "0 14px",
    borderLeft: "1px solid #f1f5f9"
  },

  attachBtn: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "9px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "nowrap"
  },

  deleteBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "9px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "nowrap"
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3000,
    padding: 20
  },

  modal: {
    background: "white",
    borderRadius: 16,
    padding: 22,
    width: "100%",
    maxWidth: 520,
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)"
  },

  modalTitle: {
    margin: 0,
    fontSize: 22,
    color: "#0f172a"
  },

  modalSubtitle: {
    color: "#64748b",
    fontSize: 14,
    margin: "8px 0 16px"
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16
  },

  fileHelp: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: 13
  }
}