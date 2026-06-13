import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function TesoreriaActividades() {
  const [actividades, setActividades] = useState([])
  const [nombre, setNombre] = useState("")
  const [editandoId, setEditandoId] = useState(null)
  const [nombreEditado, setNombreEditado] = useState("")
  const [loading, setLoading] = useState(false)
  const [generandoPdfId, setGenerandoPdfId] = useState(null)

  const navigate = useNavigate()

  const load = async () => {
    const { data, error } = await supabase
      .from("tesoreria_actividades")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error al cargar actividades:", error)
      return
    }

    setActividades(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const crearActividad = async () => {
    if (!nombre.trim()) {
      alert("Ingrese el nombre de la actividad")
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from("tesoreria_actividades")
      .insert([
        {
          nombre: nombre.trim(),
          estado: "BORRADOR",
          saldo_final: 0
        }
      ])

    setLoading(false)

    if (error) {
      console.error("Error al crear actividad:", error)
      alert("No se pudo crear la actividad")
      return
    }

    setNombre("")
    load()
  }

  const iniciarEdicion = (actividad) => {
    if (actividad.estado === "FINALIZADO") {
      alert("No se puede editar una actividad finalizada")
      return
    }

    setEditandoId(actividad.id)
    setNombreEditado(actividad.nombre)
  }

  const guardarEdicion = async (id) => {
    if (!nombreEditado.trim()) {
      alert("Ingrese un nombre válido")
      return
    }

    const { error } = await supabase
      .from("tesoreria_actividades")
      .update({
        nombre: nombreEditado.trim(),
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) {
      console.error("Error al editar actividad:", error)
      alert("No se pudo editar la actividad")
      return
    }

    setEditandoId(null)
    setNombreEditado("")
    load()
  }

  const eliminarActividad = async (actividad) => {
    if (actividad.estado === "FINALIZADO") {
      alert("No se puede eliminar una actividad finalizada")
      return
    }

    const confirmar = confirm(
      `¿Seguro que deseas eliminar la actividad "${actividad.nombre}"?`
    )

    if (!confirmar) return

    const { error } = await supabase
      .from("tesoreria_actividades")
      .delete()
      .eq("id", actividad.id)

    if (error) {
      console.error("Error al eliminar actividad:", error)
      alert("No se pudo eliminar. Verifica si tiene items asociados.")
      return
    }

    load()
  }

  const getEstadoStyle = (estado) => {
    if (estado === "FINALIZADO") {
      return {
        label: "Finalizado",
        color: "#16a34a",
        background: "#dcfce7",
        border: "#86efac",
        accent: "#22c55e"
      }
    }

    return {
      label: "Borrador",
      color: "#d97706",
      background: "#fef3c7",
      border: "#fde68a",
      accent: "#f59e0b"
    }
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha"

    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
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

const descargarPdf = async (actividad) => {
  if (actividad.estado !== "FINALIZADO") {
    alert("Solo se puede generar PDF de actividades finalizadas")
    return
  }

  setGenerandoPdfId(actividad.id)

  const { data: items, error } = await supabase
    .from("tesoreria_items")
    .select("*")
    .eq("actividad_id", actividad.id)
    .order("created_at", { ascending: true })

  setGenerandoPdfId(null)

  if (error) {
    console.error("Error al cargar items para PDF:", error)
    alert("No se pudo generar el PDF")
    return
  }

  const listaItems = items || []

  const aportesPadres = listaItems.filter(
    (item) => item.tipo === "INGRESO" && item.categoria === "CUOTA_PADRE"
  )

  const colaboraciones = listaItems.filter(
    (item) =>
      item.tipo === "INGRESO" &&
      item.categoria !== "CUOTA_PADRE"
  )

  const gastosDeducibles = listaItems.filter(
    (item) =>
      item.tipo === "GASTO" &&
      item.categoria !== "CAJA_CHICA"
  )

  const cajaChica = listaItems.filter(
    (item) => item.categoria === "CAJA_CHICA"
  )

  const totalAportesPadres = aportesPadres.reduce(
    (total, item) => total + Number(item.subtotal || 0),
    0
  )

  const totalColaboraciones = colaboraciones.reduce(
    (total, item) => total + Number(item.subtotal || 0),
    0
  )

  const totalGastosDeducibles = gastosDeducibles.reduce(
    (total, item) => total + Number(item.subtotal || 0),
    0
  )

  const totalCajaChica = cajaChica.reduce(
    (total, item) => total + Number(item.subtotal || 0),
    0
  )

  const saldoAportePadres = totalAportesPadres - totalGastosDeducibles

  const totalGeneralMovimientos =
    totalAportesPadres +
    totalColaboraciones +
    totalGastosDeducibles +
    totalCajaChica

  const doc = new jsPDF()

  const azulOscuro = [15, 23, 42]
  const azul = [37, 99, 235]
  const verde = [22, 163, 74]
  const rojo = [220, 38, 38]
  const naranja = [180, 83, 9]
  const grisClaro = [248, 250, 252]

  const revisarSaltoPagina = (alturaNecesaria = 40) => {
    if (currentY + alturaNecesaria > 275) {
      doc.addPage()
      currentY = 20
    }
  }

  const formatoSoles = (monto) => {
    return `S/ ${Number(monto || 0).toFixed(2)}`
  }

  let currentY = 18

  // ENCABEZADO MEJORADO
  doc.setFillColor(241, 245, 249)
  doc.roundedRect(14, 12, 182, 42, 3, 3, "F")

  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(14, 12, 182, 42, 3, 3, "S")

  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text("Reporte de Tesorería Escolar", 20, 24)

  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)
  doc.text(`Actividad: ${actividad.nombre}`, 20, 34)
  doc.text(`Estado: ${actividad.estado}`, 20, 41)
  doc.text(
    `Fecha inicio: ${formatearFecha(actividad.fecha_inicio || actividad.created_at)}`,
    112,
    34
  )
  doc.text(`Fecha fin: ${formatearFecha(actividad.fecha_fin)}`, 112, 41)

  currentY = 65

  // FUNCIÓN PARA TABLAS DE DETALLE
  const crearTablaDetalle = (titulo, nota, data, colorHeader) => {
    revisarSaltoPagina(45)

    doc.setFontSize(12)
    doc.setTextColor(15, 23, 42)
    doc.text(titulo, 14, currentY)

    currentY += 5

    if (nota) {
      doc.setFontSize(8.5)
      doc.setTextColor(71, 85, 105)

      const notaCortada = doc.splitTextToSize(nota, 180)
      doc.text(notaCortada, 14, currentY)

      currentY += notaCortada.length * 4 + 3
    }

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Descripción", "Categoría", "Cant.", "P. Unit.", "Subtotal"]],
      body:
        data.length > 0
          ? data.map((item, index) => [
              index + 1,
              item.descripcion || "-",
              formatoCategoria(item.categoria),
              item.cantidad,
              formatoSoles(item.precio_unitario),
              formatoSoles(item.subtotal)
            ])
          : [["-", "Sin registros", "-", "-", "-", formatoSoles(0)]],
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5
      },
      headStyles: {
        fillColor: colorHeader,
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: {
        left: 14,
        right: 14
      }
    })

    currentY = doc.lastAutoTable.finalY + 10
  }

  crearTablaDetalle(
    "1. Aportes de padres",
    "Ingresos recibidos por cuotas o aportes directos de los padres de familia.",
    aportesPadres,
    verde
  )

  crearTablaDetalle(
    "2. Colaboraciones, donaciones y otros ingresos",
    "Ingresos adicionales. Se informan aparte para no mezclarlos con el cálculo principal del aporte de padres.",
    colaboraciones,
    azul
  )

  crearTablaDetalle(
    "3. Gastos deducibles del aporte de padres",
    "Gastos que sí se descuentan del dinero recaudado por aportes de padres.",
    gastosDeducibles,
    rojo
  )

  crearTablaDetalle(
    "4. Caja chica",
    "La caja chica se registra como movimiento de control, pero no se descuenta del saldo del aporte de padres.",
    cajaChica,
    naranja
  )

  // TABLA CLAVE: LIQUIDACIÓN DEL APORTE DE PADRES
  revisarSaltoPagina(55)

  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text("5. Liquidación del aporte de padres", 14, currentY)

  currentY += 6

  autoTable(doc, {
    startY: currentY,
    head: [["Concepto", "Operación", "Monto"]],
    body: [
      [
        "Total aportes de padres",
        "Ingreso base",
        formatoSoles(totalAportesPadres)
      ],
      [
        "Gastos deducibles",
        "Se resta",
        `- ${formatoSoles(totalGastosDeducibles)}`
      ],
      [
        "Saldo que queda del aporte de padres",
        "Resultado",
        formatoSoles(saldoAportePadres)
      ]
    ],
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: azulOscuro,
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    margin: {
      left: 14,
      right: 14
    },
    didParseCell: function (data) {
      if (data.section === "body" && data.row.index === 0) {
        data.cell.styles.textColor = [22, 101, 52]
      }

      if (data.section === "body" && data.row.index === 1) {
        data.cell.styles.textColor = [185, 28, 28]
      }

      if (data.section === "body" && data.row.index === 2) {
        data.cell.styles.fontStyle = "bold"
        data.cell.styles.fillColor = [220, 252, 231]
        data.cell.styles.textColor = [22, 101, 52]
      }
    }
  })

  currentY = doc.lastAutoTable.finalY + 10

  // RESUMEN GENERAL
  revisarSaltoPagina(65)

  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text("6. Resumen general del reporte", 14, currentY)

  currentY += 6

  autoTable(doc, {
    startY: currentY,
    head: [["Resumen", "Monto"]],
    body: [
      ["Total aportes de padres", formatoSoles(totalAportesPadres)],
      ["Total gastos deducibles", formatoSoles(totalGastosDeducibles)],
      ["Saldo disponible del aporte de padres", formatoSoles(saldoAportePadres)],
      ["Total colaboraciones / donaciones", formatoSoles(totalColaboraciones)],
      ["Total caja chica", formatoSoles(totalCajaChica)],
      ["Total general de movimientos registrados", formatoSoles(totalGeneralMovimientos)]
    ],
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: azulOscuro,
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    margin: {
      left: 14,
      right: 14
    },
    didParseCell: function (data) {
      if (data.section === "body" && data.row.index === 2) {
        data.cell.styles.fontStyle = "bold"
        data.cell.styles.fillColor = [220, 252, 231]
        data.cell.styles.textColor = [22, 101, 52]
      }

      if (data.section === "body" && data.row.index === 3) {
        data.cell.styles.fillColor = [239, 246, 255]
        data.cell.styles.textColor = [30, 64, 175]
      }

      if (data.section === "body" && data.row.index === 4) {
        data.cell.styles.fillColor = [254, 243, 199]
        data.cell.styles.textColor = [146, 64, 14]
      }

      if (data.section === "body" && data.row.index === 5) {
        data.cell.styles.fontStyle = "bold"
        data.cell.styles.fillColor = grisClaro
      }
    }
  })

  currentY = doc.lastAutoTable.finalY + 10

  revisarSaltoPagina(30)

  doc.setFontSize(9)
  doc.setTextColor(51, 65, 85)

  const notaFinal = doc.splitTextToSize(
    "Nota: El saldo que queda del aporte de padres se obtiene restando únicamente los gastos deducibles al total aportado por los padres. Las colaboraciones, donaciones y caja chica se presentan en bloques separados para mantener claridad contable.",
    180
  )

  doc.text(notaFinal, 14, currentY)

  currentY += notaFinal.length * 5 + 5

  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text(
    `Saldo que queda del aporte de padres: ${formatoSoles(saldoAportePadres)}`,
    14,
    currentY
  )

  const nombreArchivo = `reporte-${actividad.nombre}`
    .toLowerCase()
    .replaceAll(" ", "-")
    .replace(/[^\w-]/g, "")

  doc.save(`${nombreArchivo}.pdf`)
}

  return (
    <div style={styles.container}>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>💳 Tesorería</h1>
          <p style={styles.subtitle}>Gestión principal de actividades</p>
        </div>

        <div style={styles.headerBadge}>
          {actividades.length} actividad{actividades.length === 1 ? "" : "es"}
        </div>
      </div>

      <div style={styles.formCard}>
        <div style={styles.formHeader}>
          <div>
            <h2 style={styles.formTitle}>Agregar actividad</h2>
            <p style={styles.formSubtitle}>
              Registra una actividad para luego agregar sus ingresos y gastos.
            </p>
          </div>
        </div>

        <div style={styles.formRow}>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ejemplo: Día de la Madre"
            style={styles.input}
          />

          <button
            onClick={crearActividad}
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Guardando..." : "➕ Agregar"}
          </button>
        </div>
      </div>

      <div style={styles.listHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Actividades registradas</h2>
          <p style={styles.listSubtitle}>
            Selecciona una actividad para ver o registrar sus detalles.
          </p>
        </div>
      </div>

      <div style={styles.grid}>
        {actividades.length === 0 && (
          <div style={styles.empty}>
            No hay actividades registradas.
          </div>
        )}

        {actividades.map((a) => {
          const estadoStyle = getEstadoStyle(a.estado)
          const estaFinalizada = a.estado === "FINALIZADO"

          return (
            <div
              key={a.id}
              style={{
                ...styles.card,
                borderLeft: `7px solid ${estadoStyle.accent}`
              }}
            >
              {editandoId === a.id && !estaFinalizada ? (
                <div style={styles.editBox}>
                  <label style={styles.editLabel}>Editar nombre de actividad</label>

                  <input
                    value={nombreEditado}
                    onChange={(e) => setNombreEditado(e.target.value)}
                    style={styles.input}
                    placeholder="Nombre de la actividad"
                  />

                  <div style={styles.actions}>
                    <button
                      onClick={() => guardarEdicion(a.id)}
                      style={styles.saveBtn}
                    >
                      💾 Guardar
                    </button>

                    <button
                      onClick={() => {
                        setEditandoId(null)
                        setNombreEditado("")
                      }}
                      style={styles.cancelBtn}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={styles.cardTop}>
                    <div>
                      <h3 style={styles.cardTitle}>{a.nombre}</h3>

                      <div style={styles.badgeRow}>
                        <span
                          style={{
                            ...styles.estadoBadge,
                            color: estadoStyle.color,
                            background: estadoStyle.background,
                            borderColor: estadoStyle.border
                          }}
                        >
                          {estadoStyle.label}
                        </span>

                        {estaFinalizada ? (
                          <span style={styles.lockBadge}>Solo lectura</span>
                        ) : (
                          <span style={styles.draftBadge}>Editable</span>
                        )}
                      </div>
                    </div>

                    <div style={styles.saldoBox}>
                      <span style={styles.saldoLabel}>Saldo final</span>
                      <strong style={styles.saldoValue}>
                        S/ {Number(a.saldo_final || 0).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>Ingresos</span>
                      <b style={styles.infoValueGreen}>
                        S/ {Number(a.total_ingresos || 0).toFixed(2)}
                      </b>
                    </div>

                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>Gastos</span>
                      <b style={styles.infoValueRed}>
                        S/ {Number(a.total_gastos || 0).toFixed(2)}
                      </b>
                    </div>

                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>Caja chica</span>
                      <b style={styles.infoValue}>
                        S/ {Number(a.total_caja_chica || 0).toFixed(2)}
                      </b>
                    </div>

                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>Fecha inicio</span>
                      <b style={styles.infoValue}>
                        {formatearFecha(a.fecha_inicio || a.created_at)}
                      </b>
                    </div>
                  </div>

                  <div style={styles.cardFooter}>
                    <div style={styles.helperText}>
                      {estaFinalizada
                        ? "Actividad finalizada. Solo puedes ver el detalle o descargar el reporte."
                        : "Actividad en borrador. Puedes editarla, eliminarla o agregar detalles."}
                    </div>

                    <div style={styles.actions}>
                      <button
                        onClick={() => navigate(`/tesoreria/${a.id}`)}
                        style={styles.detailBtn}
                      >
                        👁 Ver detalle
                      </button>

                      {estaFinalizada ? (
                        <button
                          onClick={() => descargarPdf(a)}
                          disabled={generandoPdfId === a.id}
                          style={{
                            ...styles.pdfBtn,
                            opacity: generandoPdfId === a.id ? 0.7 : 1,
                            cursor: generandoPdfId === a.id ? "not-allowed" : "pointer"
                          }}
                        >
                          {generandoPdfId === a.id
                            ? "Generando..."
                            : "📄 Descargar PDF"}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => iniciarEdicion(a)}
                            style={styles.editBtn}
                          >
                            ✏️ Editar
                          </button>

                          <button
                            onClick={() => eliminarActividad(a)}
                            style={styles.deleteBtn}
                          >
                            🗑 Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}

const styles = {
  container: {
    padding: 20,
    fontFamily: "Arial"
  },

  header: {
    marginBottom: 22,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },

  title: {
    margin: 0,
    fontSize: 30,
    color: "#0f172a"
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: 16
  },

  headerBadge: {
    background: "#e0ecff",
    color: "#1d4ed8",
    padding: "9px 14px",
    borderRadius: 999,
    fontWeight: "bold",
    fontSize: 14,
    whiteSpace: "nowrap"
  },

  formCard: {
    background: "white",
    padding: 20,
    borderRadius: 16,
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
    marginBottom: 24,
    border: "1px solid #e2e8f0"
  },

  formHeader: {
    marginBottom: 14
  },

  formTitle: {
    margin: 0,
    fontSize: 20,
    color: "#0f172a"
  },

  formSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: 14
  },

  formRow: {
    display: "flex",
    gap: 10
  },

  input: {
    flex: 1,
    padding: "12px 13px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: 15,
    background: "white"
  },

  button: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "11px 18px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "nowrap"
  },

  listHeader: {
    marginBottom: 12
  },

  sectionTitle: {
    margin: 0,
    fontSize: 22,
    color: "#0f172a"
  },

  listSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: 14
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 16
  },

  card: {
    background: "white",
    padding: 18,
    borderRadius: 16,
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.07)",
    border: "1px solid #e2e8f0"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 16
  },

  cardTitle: {
    margin: "0 0 9px 0",
    fontSize: 21,
    color: "#0f172a",
    wordBreak: "break-word"
  },

  badgeRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
  },

  estadoBadge: {
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "bold",
    border: "1px solid"
  },

  lockBadge: {
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "bold",
    color: "#334155",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0"
  },

  draftBadge: {
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "bold",
    color: "#1d4ed8",
    background: "#dbeafe",
    border: "1px solid #bfdbfe"
  },

  saldoBox: {
    minWidth: 155,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "11px 13px",
    textAlign: "right"
  },

  saldoLabel: {
    display: "block",
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4
  },

  saldoValue: {
    fontSize: 20,
    color: "#0f172a"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 10,
    marginBottom: 16
  },

  infoBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "10px 12px"
  },

  infoLabel: {
    display: "block",
    color: "#64748b",
    fontSize: 12,
    marginBottom: 5
  },

  infoValue: {
    color: "#0f172a",
    fontSize: 14
  },

  infoValueGreen: {
    color: "#16a34a",
    fontSize: 14
  },

  infoValueRed: {
    color: "#dc2626",
    fontSize: 14
  },

  cardFooter: {
    borderTop: "1px solid #f1f5f9",
    paddingTop: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap"
  },

  helperText: {
    color: "#64748b",
    fontSize: 13
  },

  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
  },

  detailBtn: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "9px 12px",
    borderRadius: 9,
    cursor: "pointer",
    fontWeight: "bold"
  },

  pdfBtn: {
    background: "#0f172a",
    color: "white",
    border: "none",
    padding: "9px 12px",
    borderRadius: 9,
    cursor: "pointer",
    fontWeight: "bold"
  },

  editBtn: {
    background: "#f59e0b",
    color: "white",
    border: "none",
    padding: "9px 12px",
    borderRadius: 9,
    cursor: "pointer",
    fontWeight: "bold"
  },

  deleteBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "9px 12px",
    borderRadius: 9,
    cursor: "pointer",
    fontWeight: "bold"
  },

  saveBtn: {
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "9px 12px",
    borderRadius: 9,
    cursor: "pointer",
    fontWeight: "bold"
  },

  cancelBtn: {
    background: "#64748b",
    color: "white",
    border: "none",
    padding: "9px 12px",
    borderRadius: 9,
    cursor: "pointer",
    fontWeight: "bold"
  },

  editBox: {
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  editLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#334155"
  },

  empty: {
    background: "white",
    padding: 22,
    borderRadius: 14,
    color: "#64748b",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)"
  }
}