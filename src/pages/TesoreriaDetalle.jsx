import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate, useParams } from "react-router-dom"

export default function TesoreriaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [actividad, setActividad] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [descripcion, setDescripcion] = useState("")
  const [tipo, setTipo] = useState("INGRESO")
  const [categoria, setCategoria] = useState("CUOTA_PADRE")
  const [cantidad, setCantidad] = useState("1")
  const [monto, setMonto] = useState("")

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

    setActividad(act)
    setItems(it || [])
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

  if (loading) {
    return <div style={styles.container}>Cargando detalle...</div>
  }

  if (!actividad) {
    return (
      <div style={styles.container}>
        <h2>Actividad no encontrada</h2>
        <button style={styles.backBtn} onClick={() => navigate("/tesoreria")}>
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
    <div style={styles.container}>

      <button style={styles.backBtn} onClick={() => navigate("/tesoreria")}>
        ← Volver
      </button>

      <section style={styles.headerCard}>
        <div>
          <h1 style={styles.title}>💳 {actividad.nombre}</h1>

          <div style={styles.infoGrid}>
            <div>
              <span style={styles.labelText}>Estado</span>
              <p style={styles.valueText}>
                <b style={{ color: estaFinalizada ? "#16a34a" : "#d97706" }}>
                  {actividad.estado || "BORRADOR"}
                </b>
              </p>
            </div>

            <div>
              <span style={styles.labelText}>Saldo actual</span>
              <p style={styles.valueText}>
                <b>S/ {saldoActual.toFixed(2)}</b>
              </p>
            </div>

            <div>
              <span style={styles.labelText}>Total de detalles</span>
              <p style={styles.valueText}>
                <b>{items.length}</b>
              </p>
            </div>
          </div>
        </div>

        {!estaFinalizada && (
          <button style={styles.finalizarBtn} onClick={finalizarActividad}>
            🔒 Finalizar actividad
          </button>
        )}
      </section>

      {!estaFinalizada && (
        <section style={styles.formCard}>
          <h2 style={styles.sectionTitle}>Agregar detalle de tesorería</h2>

          <div style={styles.field}>
            <label style={styles.label}>Descripción del detalle</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ejemplo: Cuota Día de la Madre"
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Tipo de movimiento</label>
              <select
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value)
                  setCategoria(e.target.value === "INGRESO" ? "CUOTA_PADRE" : "COMPRA")
                }}
                style={styles.input}
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
                style={styles.input}
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

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Cantidad</label>
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ejemplo: 1"
                style={styles.input}
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
                style={styles.input}
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
                  fontWeight: "bold"
                }}
              />
            </div>
          </div>

          <div style={styles.formFooter}>
            <button
              onClick={agregarItem}
              disabled={guardando}
              style={styles.addBtn}
            >
              {guardando ? "Guardando..." : "➕ Agregar detalle"}
            </button>
          </div>
        </section>
      )}

      <section style={styles.listSection}>
        <div style={styles.listHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Detalles registrados</h2>
            <p style={styles.listSubtitle}>
              Movimientos asociados a esta actividad de tesorería.
            </p>
          </div>

          <div style={styles.counterBadge}>
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

            return (
              <div key={item.id} style={styles.itemCard}>

                <div
                  style={{
                    ...styles.itemAccent,
                    background: tipoStyle.color
                  }}
                />

                <div style={styles.itemContent}>

                  <div style={styles.itemTop}>
                    <div style={styles.itemMainInfo}>
                      <h3 style={styles.itemTitle}>
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
                      </div>
                    </div>

                    <div style={styles.amountBox}>
                      <span style={styles.amountLabel}>Subtotal</span>
                      <strong
                        style={{
                          ...styles.amountValue,
                          color: tipoStyle.color
                        }}
                      >
                        {tipoStyle.signo} S/ {subtotal.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div style={styles.itemMetaGrid}>
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
                      <b style={styles.metaValue}>{item.categoria}</b>
                    </div>
                  </div>

                </div>

                {!estaFinalizada && (
                  <div style={styles.itemActions}>
                    <button
                      style={styles.deleteBtn}
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

  title: {
    margin: "0 0 18px 0",
    fontSize: 28
  },

  infoGrid: {
    display: "flex",
    gap: 35,
    flexWrap: "wrap"
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

  itemActions: {
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    borderLeft: "1px solid #f1f5f9"
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
  }
}