import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const formMultaInicial = {
  concepto_id: "",
  alumno_id: "",
  alumno_nombre: "",
  padre_nombre: "",
  padre_documento: "",
  padre_telefono: "",
  descripcion: "",
  monto_multa: ""
}

export default function TesoreriaMultas() {
  const [conceptos, setConceptos] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [multas, setMultas] = useState([])

  const [loading, setLoading] = useState(true)
  const [guardandoConcepto, setGuardandoConcepto] = useState(false)
  const [guardandoMulta, setGuardandoMulta] = useState(false)
  const [generandoPdf, setGenerandoPdf] = useState(false)

  const [conceptoNombre, setConceptoNombre] = useState("")
  const [conceptoDescripcion, setConceptoDescripcion] = useState("")
  const [conceptoMonto, setConceptoMonto] = useState("")

  const [formMulta, setFormMulta] = useState(formMultaInicial)

  const [filtroEstado, setFiltroEstado] = useState("")
  const [filtroConcepto, setFiltroConcepto] = useState("")
  const [busqueda, setBusqueda] = useState("")

  const [modal, setModal] = useState(null)
  const [pagoMonto, setPagoMonto] = useState("")
  const [sustentoDescripcion, setSustentoDescripcion] = useState("")
  const [sustentoUrl, setSustentoUrl] = useState("")
  const [sustentoFile, setSustentoFile] = useState(null)
  const [subiendoSustento, setSubiendoSustento] = useState(false)

  const load = async () => {
    setLoading(true)

    const { data: conceptosData, error: conceptosError } = await supabase
      .from("tesoreria_multa_conceptos")
      .select("*")
      .order("created_at", { ascending: true })

    if (conceptosError) {
      console.error("Error al cargar conceptos:", conceptosError)
      alert("No se pudieron cargar los conceptos de multa")
    }

    const { data: alumnosData, error: alumnosError } = await supabase
      .from("alumnos")
      .select("*")

    if (alumnosError) {
      console.error("Error al cargar alumnos:", alumnosError)
    }

    const { data: multasData, error: multasError } = await supabase
      .from("tesoreria_multas")
      .select("*")
      .order("fecha_asignacion", { ascending: false })

    if (multasError) {
      console.error("Error al cargar multas:", multasError)
      alert("No se pudieron cargar las multas")
    }

    const conceptosLista = conceptosData || []

    setConceptos(conceptosLista)
    setAlumnos(alumnosData || [])
    setMultas(multasData || [])

    setFormMulta((prev) => ({
      ...prev,
      concepto_id: prev.concepto_id || conceptosLista[0]?.id || "",
      monto_multa:
        prev.monto_multa ||
        (conceptosLista[0]?.monto_default
          ? String(conceptosLista[0].monto_default)
          : "")
    }))

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const getAlumnoNombre = (alumno) => {
    if (!alumno) return ""

    if (alumno.nombre_completo) return alumno.nombre_completo
    if (alumno.nombre) return alumno.nombre

    const partes = [
      alumno.nombres,
      alumno.apellidos,
      alumno.apellido_paterno,
      alumno.apellido_materno
    ].filter(Boolean)

    return partes.join(" ") || "Alumno sin nombre"
  }

  const getPadreNombre = (alumno) => {
    if (!alumno) return ""

    return (
      alumno.padre_nombre ||
      alumno.nombre_padre ||
      alumno.apoderado_nombre ||
      alumno.nombre_apoderado ||
      alumno.padre ||
      alumno.apoderado ||
      ""
    )
  }

  const getPadreDocumento = (alumno) => {
    if (!alumno) return ""

    return (
      alumno.padre_documento ||
      alumno.documento_padre ||
      alumno.dni_padre ||
      alumno.apoderado_documento ||
      alumno.documento_apoderado ||
      alumno.dni_apoderado ||
      ""
    )
  }

  const getPadreTelefono = (alumno) => {
    if (!alumno) return ""

    return (
      alumno.padre_telefono ||
      alumno.telefono_padre ||
      alumno.apoderado_telefono ||
      alumno.telefono_apoderado ||
      alumno.telefono ||
      ""
    )
  }

  const getNombreConcepto = (conceptoId) => {
    const concepto = conceptos.find((c) => c.id === conceptoId)
    return concepto?.nombre || "Sin concepto"
  }

  const formatoSoles = (monto) => {
    return `S/ ${Number(monto || 0).toFixed(2)}`
  }

  const formatoFecha = (fecha) => {
    if (!fecha) return "Sin fecha"

    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }

  const calcularPendiente = (multa) => {
    if (multa.estado === "SUSTENTADA") return 0

    return Math.max(
      Number(multa.monto_multa || 0) - Number(multa.monto_pagado || 0),
      0
    )
  }

  const calcularEstadoMulta = ({ montoMulta, montoPagado, tieneSustento }) => {
    if (tieneSustento) return "SUSTENTADA"

    if (Number(montoPagado) >= Number(montoMulta)) {
      return "PAGADA"
    }

    if (Number(montoPagado) > 0) {
      return "PARCIAL"
    }

    return "PENDIENTE"
  }

  const getEstadoStyle = (estado) => {
    if (estado === "PAGADA") {
      return {
        label: "Pagada",
        color: "#16a34a",
        background: "#dcfce7",
        border: "#86efac"
      }
    }

    if (estado === "PARCIAL") {
      return {
        label: "Pago parcial",
        color: "#2563eb",
        background: "#dbeafe",
        border: "#bfdbfe"
      }
    }

    if (estado === "SUSTENTADA") {
      return {
        label: "Con sustento",
        color: "#7c3aed",
        background: "#ede9fe",
        border: "#ddd6fe"
      }
    }

    return {
      label: "Pendiente",
      color: "#dc2626",
      background: "#fee2e2",
      border: "#fecaca"
    }
  }

  const estadisticas = useMemo(() => {
    return multas.reduce(
      (acc, multa) => {
        acc.total += 1
        acc.totalAsignado += Number(multa.monto_multa || 0)
        acc.totalPagado += Number(multa.monto_pagado || 0)
        acc.totalPendiente += calcularPendiente(multa)

        if (multa.estado === "PAGADA") acc.pagadas += 1
        if (multa.estado === "PENDIENTE") acc.pendientes += 1
        if (multa.estado === "PARCIAL") acc.parciales += 1
        if (multa.estado === "SUSTENTADA") acc.sustentadas += 1

        return acc
      },
      {
        total: 0,
        pagadas: 0,
        pendientes: 0,
        parciales: 0,
        sustentadas: 0,
        totalAsignado: 0,
        totalPagado: 0,
        totalPendiente: 0
      }
    )
  }, [multas])

  const multasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    return multas.filter((multa) => {
      const coincideEstado = filtroEstado
        ? multa.estado === filtroEstado
        : true

      const coincideConcepto = filtroConcepto
        ? multa.concepto_id === filtroConcepto
        : true

      const concepto = getNombreConcepto(multa.concepto_id).toLowerCase()

      const coincideBusqueda = texto
        ? [
            multa.padre_nombre,
            multa.alumno_nombre,
            multa.padre_documento,
            multa.descripcion,
            concepto
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(texto)
        : true

      return coincideEstado && coincideConcepto && coincideBusqueda
    })
  }, [multas, filtroEstado, filtroConcepto, busqueda, conceptos])

  const crearConcepto = async () => {
    if (!conceptoNombre.trim()) {
      alert("Ingrese el nombre del concepto")
      return
    }

    setGuardandoConcepto(true)

    const { error } = await supabase
      .from("tesoreria_multa_conceptos")
      .insert([
        {
          nombre: conceptoNombre.trim(),
          descripcion: conceptoDescripcion.trim() || null,
          monto_default: Number(conceptoMonto || 0),
          activo: true
        }
      ])

    setGuardandoConcepto(false)

    if (error) {
      console.error("Error al crear concepto:", error)
      alert(`No se pudo crear el concepto: ${error.message}`)
      return
    }

    setConceptoNombre("")
    setConceptoDescripcion("")
    setConceptoMonto("")
    load()
  }

  const seleccionarAlumno = (alumnoId) => {
    const alumno = alumnos.find((a) => String(a.id) === String(alumnoId))

    if (!alumno) {
      setFormMulta((prev) => ({
        ...prev,
        alumno_id: "",
        alumno_nombre: "",
        padre_nombre: "",
        padre_documento: "",
        padre_telefono: ""
      }))
      return
    }

    setFormMulta((prev) => ({
      ...prev,
      alumno_id: alumno.id,
      alumno_nombre: getAlumnoNombre(alumno),
      padre_nombre: getPadreNombre(alumno),
      padre_documento: getPadreDocumento(alumno),
      padre_telefono: getPadreTelefono(alumno)
    }))
  }

  const cambiarConceptoMulta = (conceptoId) => {
    const concepto = conceptos.find((c) => c.id === conceptoId)

    setFormMulta((prev) => ({
      ...prev,
      concepto_id: conceptoId,
      monto_multa: concepto?.monto_default
        ? String(concepto.monto_default)
        : prev.monto_multa
    }))
  }

  const crearMulta = async () => {
    if (!formMulta.concepto_id) {
      alert("Seleccione un concepto de multa")
      return
    }

    if (!formMulta.padre_nombre.trim()) {
      alert("Ingrese o seleccione el nombre del padre/apoderado")
      return
    }

    if (Number(formMulta.monto_multa) <= 0) {
      alert("Ingrese un monto válido para la multa")
      return
    }

    setGuardandoMulta(true)

    const { error } = await supabase
      .from("tesoreria_multas")
      .insert([
        {
          concepto_id: formMulta.concepto_id,
          alumno_id: formMulta.alumno_id || null,
          alumno_nombre: formMulta.alumno_nombre.trim() || null,
          padre_nombre: formMulta.padre_nombre.trim(),
          padre_documento: formMulta.padre_documento.trim() || null,
          padre_telefono: formMulta.padre_telefono.trim() || null,
          descripcion: formMulta.descripcion.trim() || null,
          monto_multa: Number(formMulta.monto_multa),
          monto_pagado: 0,
          tiene_sustento: false,
          estado: "PENDIENTE"
        }
      ])

    setGuardandoMulta(false)

    if (error) {
      console.error("Error al asignar multa:", error)
      alert(`No se pudo asignar la multa: ${error.message}`)
      return
    }

    setFormMulta({
      ...formMultaInicial,
      concepto_id: conceptos[0]?.id || "",
      monto_multa: conceptos[0]?.monto_default
        ? String(conceptos[0].monto_default)
        : ""
    })

    load()
  }

  const abrirModalPago = (multa) => {
    if (multa.estado === "PAGADA" || multa.estado === "SUSTENTADA") {
      alert("Esta multa ya está cerrada")
      return
    }

    setModal({
      tipo: "PAGO",
      multa
    })
    setPagoMonto(String(multa.monto_pagado || ""))
  }

  const abrirModalSustento = (multa) => {
    if (multa.estado === "PAGADA" || multa.estado === "SUSTENTADA") {
      alert("Esta multa ya está cerrada")
      return
    }

    setModal({
      tipo: "SUSTENTO",
      multa
    })
    setSustentoDescripcion(multa.sustento_descripcion || "")
    setSustentoUrl(multa.sustento_url || "")
    setSustentoFile(null)
  }

  const cerrarModal = () => {
    setModal(null)
    setPagoMonto("")
    setSustentoDescripcion("")
    setSustentoUrl("")
    setSustentoFile(null)
    setSubiendoSustento(false)
  }

  const registrarPago = async () => {
    if (!modal?.multa) return

    if (Number(pagoMonto) <= 0) {
      alert("Ingrese un monto pagado válido")
      return
    }

    const multa = modal.multa
    const nuevoEstado = calcularEstadoMulta({
      montoMulta: multa.monto_multa,
      montoPagado: pagoMonto,
      tieneSustento: false
    })

    const { error } = await supabase
      .from("tesoreria_multas")
      .update({
        monto_pagado: Number(pagoMonto),
        fecha_pago: new Date().toISOString(),
        tiene_sustento: false,
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq("id", multa.id)

    if (error) {
      console.error("Error al registrar pago:", error)
      alert(`No se pudo registrar el pago: ${error.message}`)
      return
    }

    cerrarModal()
    load()
  }

  const subirArchivoSustento = async (multaId) => {
    if (!sustentoFile) {
      return sustentoUrl.trim() || null
    }

    const extension = sustentoFile.name.split(".").pop() || "archivo"

    const nombreLimpio = sustentoFile.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9.-]/g, "")

    const filePath = `multas/${multaId}/${Date.now()}-${
      nombreLimpio || `sustento.${extension}`
    }`

    const { error: uploadError } = await supabase.storage
      .from("tesoreria-sustentos_multas")
      .upload(filePath, sustentoFile, {
        cacheControl: "3600",
        upsert: false
      })

    if (uploadError) {
      console.error("Error al subir sustento:", uploadError)
      throw new Error(uploadError.message)
    }

    const { data } = supabase.storage
      .from("tesoreria-sustentos_multas")
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const registrarSustento = async () => {
    if (!modal?.multa) return

    if (!sustentoDescripcion.trim()) {
      alert("Ingrese la descripción del sustento")
      return
    }

    if (!sustentoFile && !sustentoUrl.trim()) {
      alert("Seleccione un archivo o ingrese una URL de sustento")
      return
    }

    try {
      setSubiendoSustento(true)

      const urlFinal = await subirArchivoSustento(modal.multa.id)

      const { error } = await supabase
        .from("tesoreria_multas")
        .update({
          tiene_sustento: true,
          sustento_descripcion: sustentoDescripcion.trim(),
          sustento_url: urlFinal,
          fecha_sustento: new Date().toISOString(),
          estado: "SUSTENTADA",
          updated_at: new Date().toISOString()
        })
        .eq("id", modal.multa.id)

      setSubiendoSustento(false)

      if (error) {
        console.error("Error al registrar sustento:", error)
        alert(`No se pudo registrar el sustento: ${error.message}`)
        return
      }

      cerrarModal()
      load()
    } catch (error) {
      setSubiendoSustento(false)
      console.error("Error general al registrar sustento:", error)
      alert(`No se pudo subir el sustento: ${error.message}`)
    }
  }

  const generarReportePdf = async () => {
    setGenerandoPdf(true)

    const { data, error } = await supabase
      .from("tesoreria_multas")
      .select("*")
      .order("fecha_asignacion", { ascending: true })

    setGenerandoPdf(false)

    if (error) {
      console.error("Error al generar reporte:", error)
      alert(`No se pudo generar el reporte: ${error.message}`)
      return
    }

    const listaMultas = data || []

    const formatoPdfSoles = (monto) => `S/ ${Number(monto || 0).toFixed(2)}`

    const grupos = listaMultas.reduce((acc, multa) => {
      const concepto = getNombreConcepto(multa.concepto_id)

      if (!acc[concepto]) {
        acc[concepto] = []
      }

      acc[concepto].push(multa)
      return acc
    }, {})

    const resumenConceptos = Object.entries(grupos).map(([concepto, registros]) => {
      const totalAsignado = registros.reduce(
        (sum, m) => sum + Number(m.monto_multa || 0),
        0
      )

      const totalPagado = registros.reduce(
        (sum, m) => sum + Number(m.monto_pagado || 0),
        0
      )

      const totalPendiente = registros.reduce(
        (sum, m) => sum + calcularPendiente(m),
        0
      )

      return {
        concepto,
        totalMultas: registros.length,
        pagadas: registros.filter((m) => m.estado === "PAGADA").length,
        noPagadas: registros.filter(
          (m) => m.estado === "PENDIENTE" || m.estado === "PARCIAL"
        ).length,
        sustentadas: registros.filter((m) => m.estado === "SUSTENTADA").length,
        totalAsignado,
        totalPagado,
        totalPendiente
      }
    })

    const totalAsignadoGlobal = resumenConceptos.reduce(
      (sum, r) => sum + r.totalAsignado,
      0
    )

    const totalPagadoGlobal = resumenConceptos.reduce(
      (sum, r) => sum + r.totalPagado,
      0
    )

    const totalPendienteGlobal = resumenConceptos.reduce(
      (sum, r) => sum + r.totalPendiente,
      0
    )

    const doc = new jsPDF()
    let currentY = 18

    const revisarSalto = (altura = 50) => {
      if (currentY + altura > 275) {
        doc.addPage()
        currentY = 18
      }
    }

    doc.setFillColor(241, 245, 249)
    doc.roundedRect(14, 10, 182, 42, 3, 3, "F")

    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(14, 10, 182, 42, 3, 3, "S")

    doc.setTextColor(15, 23, 42)
    doc.setFontSize(16)
    doc.text("Reporte de Multas de Tesorería", 20, 24)

    doc.setFontSize(10)
    doc.text(`Fecha de emisión: ${formatoFecha(new Date().toISOString())}`, 20, 35)
    doc.text(`Total de multas registradas: ${listaMultas.length}`, 20, 43)

    currentY = 62

    doc.setFontSize(12)
    doc.text("1. Resumen general por concepto", 14, currentY)
    currentY += 6

    autoTable(doc, {
      startY: currentY,
      head: [[
        "Concepto",
        "Total",
        "Pagadas",
        "No pagadas",
        "Sustento",
        "Asignado",
        "Pagado",
        "Pendiente"
      ]],
      body: resumenConceptos.map((r) => [
        r.concepto,
        r.totalMultas,
        r.pagadas,
        r.noPagadas,
        r.sustentadas,
        formatoPdfSoles(r.totalAsignado),
        formatoPdfSoles(r.totalPagado),
        formatoPdfSoles(r.totalPendiente)
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255]
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

    autoTable(doc, {
      startY: currentY,
      head: [["Totales finales", "Monto"]],
      body: [
        ["Total asignado en multas", formatoPdfSoles(totalAsignadoGlobal)],
        ["Total pagado", formatoPdfSoles(totalPagadoGlobal)],
        ["Total pendiente por cobrar", formatoPdfSoles(totalPendienteGlobal)]
      ],
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255]
      },
      didParseCell: function (data) {
        if (data.section === "body" && data.row.index === 2) {
          data.cell.styles.fontStyle = "bold"
          data.cell.styles.fillColor = [254, 226, 226]
          data.cell.styles.textColor = [185, 28, 28]
        }
      },
      margin: {
        left: 14,
        right: 14
      }
    })

    currentY = doc.lastAutoTable.finalY + 12

    Object.entries(grupos).forEach(([concepto, registros], index) => {
      revisarSalto(65)

      doc.setFontSize(12)
      doc.setTextColor(15, 23, 42)
      doc.text(`${index + 2}. Detalle por concepto: ${concepto}`, 14, currentY)

      currentY += 6

      autoTable(doc, {
        startY: currentY,
        head: [[
          "#",
          "Padre/Apoderado",
          "Alumno",
          "Estado",
          "Multa",
          "Pagado",
          "Pendiente",
          "Sustento"
        ]],
        body: registros.map((multa, i) => [
          i + 1,
          multa.padre_nombre || "-",
          multa.alumno_nombre || "-",
          multa.estado,
          formatoPdfSoles(multa.monto_multa),
          formatoPdfSoles(multa.monto_pagado),
          formatoPdfSoles(calcularPendiente(multa)),
          multa.estado === "SUSTENTADA"
            ? multa.sustento_descripcion || "Con sustento"
            : "-"
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [22, 163, 74],
          textColor: [255, 255, 255]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: {
          left: 14,
          right: 14
        },
        didParseCell: function (data) {
          if (data.section === "body" && data.column.index === 3) {
            if (data.cell.raw === "PAGADA") {
              data.cell.styles.textColor = [22, 101, 52]
              data.cell.styles.fontStyle = "bold"
            }

            if (data.cell.raw === "PENDIENTE") {
              data.cell.styles.textColor = [185, 28, 28]
              data.cell.styles.fontStyle = "bold"
            }

            if (data.cell.raw === "PARCIAL") {
              data.cell.styles.textColor = [30, 64, 175]
              data.cell.styles.fontStyle = "bold"
            }

            if (data.cell.raw === "SUSTENTADA") {
              data.cell.styles.textColor = [109, 40, 217]
              data.cell.styles.fontStyle = "bold"
            }
          }
        }
      })

      currentY = doc.lastAutoTable.finalY + 12
    })

    revisarSalto(25)

    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)

    const nota = doc.splitTextToSize(
      "Nota: Las multas sustentadas no se consideran como saldo pendiente por cobrar. Las multas parciales se consideran no pagadas hasta completar el monto total asignado.",
      180
    )

    doc.text(nota, 14, currentY)

    doc.save("reporte-multas-tesoreria.pdf")
  }

  if (loading) {
    return <div style={styles.container}>Cargando módulo de multas...</div>
  }

  return (
    <div style={styles.container}>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>💳 Multas de Tesorería</h1>
          <p style={styles.subtitle}>
            Registro de conceptos, asignación de multas, pagos y sustentos.
          </p>
        </div>

        <button
          onClick={generarReportePdf}
          disabled={generandoPdf}
          style={{
            ...styles.reportBtn,
            opacity: generandoPdf ? 0.7 : 1,
            cursor: generandoPdf ? "not-allowed" : "pointer"
          }}
        >
          {generandoPdf ? "Generando..." : "📄 Reporte PDF"}
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Total multas</span>
          <strong style={styles.statValue}>{estadisticas.total}</strong>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statLabel}>Pagadas</span>
          <strong style={styles.statGreen}>{estadisticas.pagadas}</strong>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statLabel}>No pagadas</span>
          <strong style={styles.statRed}>
            {estadisticas.pendientes + estadisticas.parciales}
          </strong>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statLabel}>Con sustento</span>
          <strong style={styles.statPurple}>{estadisticas.sustentadas}</strong>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statLabel}>Total pagado</span>
          <strong style={styles.statValue}>
            {formatoSoles(estadisticas.totalPagado)}
          </strong>
        </div>
      </div>

      <div style={styles.mainGrid}>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Conceptos de multa</h2>
          <p style={styles.sectionText}>
            Puedes registrar conceptos como multas por brigadas, reuniones u otros.
          </p>

          <div style={styles.field}>
            <label style={styles.label}>Nombre del concepto</label>
            <input
              value={conceptoNombre}
              onChange={(e) => setConceptoNombre(e.target.value)}
              placeholder="Ejemplo: Multas por reuniones"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Descripción</label>
            <input
              value={conceptoDescripcion}
              onChange={(e) => setConceptoDescripcion(e.target.value)}
              placeholder="Descripción opcional"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Monto sugerido</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={conceptoMonto}
              onChange={(e) => setConceptoMonto(e.target.value)}
              placeholder="Ejemplo: 10.00"
              style={styles.input}
            />
          </div>

          <button
            onClick={crearConcepto}
            disabled={guardandoConcepto}
            style={styles.primaryBtn}
          >
            {guardandoConcepto ? "Guardando..." : "➕ Agregar concepto"}
          </button>

          <div style={styles.conceptList}>
            {conceptos.map((concepto) => (
              <div key={concepto.id} style={styles.conceptItem}>
                <div>
                  <b>{concepto.nombre}</b>
                  <p style={styles.conceptText}>
                    Monto sugerido: {formatoSoles(concepto.monto_default)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Asignar multa a padre</h2>
          <p style={styles.sectionText}>
            Relaciona la multa con un alumno y registra los datos del padre.
          </p>

          <div style={styles.field}>
            <label style={styles.label}>Alumno relacionado</label>
            <select
              value={formMulta.alumno_id}
              onChange={(e) => seleccionarAlumno(e.target.value)}
              style={styles.input}
            >
              <option value="">Seleccionar alumno</option>
              {alumnos.map((alumno) => (
                <option key={alumno.id} value={alumno.id}>
                  {getAlumnoNombre(alumno)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.twoCols}>
            <div style={styles.field}>
              <label style={styles.label}>Alumno</label>
              <input
                value={formMulta.alumno_nombre}
                onChange={(e) =>
                  setFormMulta({ ...formMulta, alumno_nombre: e.target.value })
                }
                placeholder="Nombre del alumno"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Padre / apoderado</label>
              <input
                value={formMulta.padre_nombre}
                onChange={(e) =>
                  setFormMulta({ ...formMulta, padre_nombre: e.target.value })
                }
                placeholder="Nombre del padre"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.twoCols}>
            <div style={styles.field}>
              <label style={styles.label}>Documento</label>
              <input
                value={formMulta.padre_documento}
                onChange={(e) =>
                  setFormMulta({ ...formMulta, padre_documento: e.target.value })
                }
                placeholder="DNI u otro documento"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Teléfono</label>
              <input
                value={formMulta.padre_telefono}
                onChange={(e) =>
                  setFormMulta({ ...formMulta, padre_telefono: e.target.value })
                }
                placeholder="Teléfono del padre"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.twoCols}>
            <div style={styles.field}>
              <label style={styles.label}>Concepto</label>
              <select
                value={formMulta.concepto_id}
                onChange={(e) => cambiarConceptoMulta(e.target.value)}
                style={styles.input}
              >
                <option value="">Seleccionar concepto</option>
                {conceptos.map((concepto) => (
                  <option key={concepto.id} value={concepto.id}>
                    {concepto.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Monto de multa</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formMulta.monto_multa}
                onChange={(e) =>
                  setFormMulta({ ...formMulta, monto_multa: e.target.value })
                }
                placeholder="Ejemplo: 10.00"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Observación</label>
            <input
              value={formMulta.descripcion}
              onChange={(e) =>
                setFormMulta({ ...formMulta, descripcion: e.target.value })
              }
              placeholder="Motivo u observación de la multa"
              style={styles.input}
            />
          </div>

          <button
            onClick={crearMulta}
            disabled={guardandoMulta}
            style={styles.primaryBtn}
          >
            {guardandoMulta ? "Guardando..." : "💾 Asignar multa"}
          </button>
        </section>

      </div>

      <section style={styles.listCard}>
        <div style={styles.listHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Multas registradas</h2>
            <p style={styles.sectionText}>
              Control de pagos, pendientes y sustentos.
            </p>
          </div>
        </div>

        <div style={styles.filters}>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por padre, alumno o concepto"
            style={styles.input}
          />

          <select
            value={filtroConcepto}
            onChange={(e) => setFiltroConcepto(e.target.value)}
            style={styles.input}
          >
            <option value="">Todos los conceptos</option>
            {conceptos.map((concepto) => (
              <option key={concepto.id} value={concepto.id}>
                {concepto.nombre}
              </option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={styles.input}
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PARCIAL">Pago parcial</option>
            <option value="PAGADA">Pagada</option>
            <option value="SUSTENTADA">Con sustento</option>
          </select>
        </div>

        {multasFiltradas.length === 0 && (
          <div style={styles.empty}>
            No hay multas registradas con los filtros seleccionados.
          </div>
        )}

        <div style={styles.multasList}>
          {multasFiltradas.map((multa) => {
            const estado = getEstadoStyle(multa.estado)
            const pendiente = calcularPendiente(multa)

            const multaCerrada =
              multa.estado === "PAGADA" || multa.estado === "SUSTENTADA"

            return (
              <div key={multa.id} style={styles.multaCard}>
                <div style={styles.multaTop}>
                  <div>
                    <h3 style={styles.multaTitle}>
                      {multa.padre_nombre}
                    </h3>

                    <div style={styles.badgeRow}>
                      <span
                        style={{
                          ...styles.estadoBadge,
                          color: estado.color,
                          background: estado.background,
                          borderColor: estado.border
                        }}
                      >
                        {estado.label}
                      </span>

                      <span style={styles.conceptBadge}>
                        {getNombreConcepto(multa.concepto_id)}
                      </span>
                    </div>
                  </div>

                  <div style={styles.amountBox}>
                    <span style={styles.amountLabel}>Multa</span>
                    <strong style={styles.amountValue}>
                      {formatoSoles(multa.monto_multa)}
                    </strong>
                  </div>
                </div>

                <div style={styles.infoGrid}>
                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Alumno</span>
                    <b style={styles.infoValue}>
                      {multa.alumno_nombre || "Sin alumno"}
                    </b>
                  </div>

                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Pagado</span>
                    <b style={styles.infoGreen}>
                      {formatoSoles(multa.monto_pagado)}
                    </b>
                  </div>

                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Pendiente</span>
                    <b style={styles.infoRed}>
                      {formatoSoles(pendiente)}
                    </b>
                  </div>

                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Fecha</span>
                    <b style={styles.infoValue}>
                      {formatoFecha(multa.fecha_asignacion)}
                    </b>
                  </div>
                </div>

                {multa.estado === "SUSTENTADA" && (
                  <div style={styles.sustentoBox}>
                    <b>Sustento:</b>{" "}
                    {multa.sustento_descripcion || "Sin descripción"}
                    {multa.sustento_url && (
                      <>
                        {" "}
                        <a
                          href={multa.sustento_url}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.link}
                        >
                          Ver archivo
                        </a>
                      </>
                    )}
                  </div>
                )}

                <div style={styles.cardFooter}>
                  <p style={styles.helperText}>
                    {multa.descripcion || "Sin observación adicional"}
                  </p>

                  {!multaCerrada ? (
                    <div style={styles.actions}>
                      <button
                        onClick={() => abrirModalPago(multa)}
                        style={styles.payBtn}
                      >
                        💰 Registrar pago
                      </button>

                      <button
                        onClick={() => abrirModalSustento(multa)}
                        style={styles.supportBtn}
                      >
                        📎 Registrar sustento
                      </button>
                    </div>
                  ) : (
                    <div style={styles.actions}>
                      <span
                        style={{
                          ...styles.closedBadge,
                          color: multa.estado === "PAGADA" ? "#166534" : "#6d28d9",
                          background:
                            multa.estado === "PAGADA" ? "#dcfce7" : "#ede9fe",
                          borderColor:
                            multa.estado === "PAGADA" ? "#86efac" : "#ddd6fe"
                        }}
                      >
                        {multa.estado === "PAGADA"
                          ? "✅ Multa pagada"
                          : "📎 Multa sustentada"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {modal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            {modal.tipo === "PAGO" && (
              <>
                <h2 style={styles.modalTitle}>Registrar pago</h2>
                <p style={styles.sectionText}>
                  Padre: <b>{modal.multa.padre_nombre}</b>
                </p>

                <div style={styles.field}>
                  <label style={styles.label}>Monto pagado acumulado</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pagoMonto}
                    onChange={(e) => setPagoMonto(e.target.value)}
                    style={styles.input}
                    placeholder="Ejemplo: 10.00"
                  />
                </div>

                <div style={styles.modalActions}>
                  <button onClick={registrarPago} style={styles.primaryBtn}>
                    Guardar pago
                  </button>

                  <button onClick={cerrarModal} style={styles.cancelBtn}>
                    Cancelar
                  </button>
                </div>
              </>
            )}

            {modal.tipo === "SUSTENTO" && (
              <>
                <h2 style={styles.modalTitle}>Registrar sustento</h2>
                <p style={styles.sectionText}>
                  Padre: <b>{modal.multa.padre_nombre}</b>
                </p>

                <div style={styles.field}>
                  <label style={styles.label}>Descripción del sustento</label>
                  <input
                    value={sustentoDescripcion}
                    onChange={(e) => setSustentoDescripcion(e.target.value)}
                    style={styles.input}
                    placeholder="Ejemplo: presentó justificación por trabajo"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Archivo del sustento</label>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => setSustentoFile(e.target.files?.[0] || null)}
                    style={styles.input}
                  />

                  {sustentoFile && (
                    <p style={styles.fileHelp}>
                      Archivo seleccionado: <b>{sustentoFile.name}</b>
                    </p>
                  )}
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>URL del sustento</label>
                  <input
                    value={sustentoUrl}
                    onChange={(e) => setSustentoUrl(e.target.value)}
                    style={styles.input}
                    placeholder="Opcional: pega una URL si ya tienes el archivo en otro lugar"
                  />
                </div>

                <div style={styles.modalActions}>
                  <button
                    onClick={registrarSustento}
                    disabled={subiendoSustento}
                    style={{
                      ...styles.primaryBtn,
                      opacity: subiendoSustento ? 0.7 : 1,
                      cursor: subiendoSustento ? "not-allowed" : "pointer"
                    }}
                  >
                    {subiendoSustento ? "Subiendo archivo..." : "Guardar sustento"}
                  </button>

                  <button onClick={cerrarModal} style={styles.cancelBtn}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    marginBottom: 20
  },

  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: 30
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: 15
  },

  reportBtn: {
    background: "#0f172a",
    color: "white",
    border: "none",
    padding: "12px 16px",
    borderRadius: 12,
    fontWeight: "bold"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 12,
    marginBottom: 20
  },

  statCard: {
    background: "white",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e2e8f0"
  },

  statLabel: {
    display: "block",
    color: "#64748b",
    fontSize: 13,
    marginBottom: 6
  },

  statValue: {
    fontSize: 22,
    color: "#0f172a"
  },

  statGreen: {
    fontSize: 22,
    color: "#16a34a"
  },

  statRed: {
    fontSize: 22,
    color: "#dc2626"
  },

  statPurple: {
    fontSize: 22,
    color: "#7c3aed"
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 16,
    marginBottom: 20
  },

  card: {
    background: "white",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e2e8f0"
  },

  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: 21
  },

  sectionText: {
    color: "#64748b",
    fontSize: 14,
    margin: "6px 0 14px"
  },

  field: {
    display: "flex",
    flexDirection: "column",
    marginBottom: 12
  },

  label: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "bold",
    marginBottom: 6
  },

  input: {
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    outline: "none",
    fontSize: 14,
    background: "white",
    width: "100%",
    boxSizing: "border-box"
  },

  twoCols: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12
  },

  primaryBtn: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "11px 14px",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer"
  },

  cancelBtn: {
    background: "#64748b",
    color: "white",
    border: "none",
    padding: "11px 14px",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer"
  },

  conceptList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 15
  },

  conceptItem: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 12
  },

  conceptText: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: 13
  },

  listCard: {
    background: "white",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e2e8f0"
  },

  listHeader: {
    marginBottom: 14
  },

  filters: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr",
    gap: 10,
    marginBottom: 16
  },

  empty: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 16,
    color: "#64748b"
  },

  multasList: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },

  multaCard: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.05)"
  },

  multaTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
    marginBottom: 14
  },

  multaTitle: {
    margin: "0 0 8px",
    color: "#0f172a",
    fontSize: 20
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

  conceptBadge: {
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "bold",
    color: "#334155",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0"
  },

  amountBox: {
    minWidth: 140,
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
    color: "#0f172a",
    fontSize: 20
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 10,
    marginBottom: 12
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
    marginBottom: 4
  },

  infoValue: {
    color: "#0f172a",
    fontSize: 14
  },

  infoGreen: {
    color: "#16a34a",
    fontSize: 14
  },

  infoRed: {
    color: "#dc2626",
    fontSize: 14
  },

  sustentoBox: {
    background: "#f5f3ff",
    color: "#5b21b6",
    border: "1px solid #ddd6fe",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 14
  },

  link: {
    color: "#2563eb",
    fontWeight: "bold"
  },

  cardFooter: {
    borderTop: "1px solid #f1f5f9",
    paddingTop: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  },

  helperText: {
    color: "#64748b",
    fontSize: 13,
    margin: 0
  },

  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
  },

  payBtn: {
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "9px 12px",
    borderRadius: 9,
    fontWeight: "bold",
    cursor: "pointer"
  },

  supportBtn: {
    background: "#7c3aed",
    color: "white",
    border: "none",
    padding: "9px 12px",
    borderRadius: 9,
    fontWeight: "bold",
    cursor: "pointer"
  },

  closedBadge: {
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: "bold",
    border: "1px solid",
    whiteSpace: "nowrap"
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3000,
    padding: 20
  },

  modal: {
    background: "white",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 520,
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)"
  },

  modalTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: 22
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