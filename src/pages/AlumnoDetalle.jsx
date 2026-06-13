import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"
import AlumnoReportePrint from "./AlumnoReportePrint"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export default function AlumnoDetalle() {
  const { id } = useParams()

  const [mov, setMov] = useState([])
  const [alumno, setAlumno] = useState(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data: alumnoData } = await supabase
      .from("alumnos")
      .select("nombre")
      .eq("id", id)
      .single()

    const { data: movData } = await supabase
      .from("movimientos")
      .select("*")
      .eq("alumno_id", id)
      .order("created_at", { ascending: true })

    setAlumno(alumnoData)
    setMov(movData || [])
  }

  const ingresos = mov
    .filter(m => m.tipo === "INGRESO")
    .reduce((a, b) => a + Number(b.monto), 0)

  const gastos = mov
    .filter(m => m.tipo === "GASTO")
    .reduce((a, b) => a + Number(b.monto), 0)

  const saldoFinal = ingresos - gastos

  const print = () => window.print()

  /* =========================
     🔥 PDF DESCARGA FIX REAL
  ========================= */
  const descargarPDF = async () => {
    const element = document.querySelector(".print-area")

    if (!element) {
      alert("No se encontró el contenido del PDF")
      return
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    })

    // 🔥 FIX ERROR PNG: usar JPEG
    const imgData = canvas.toDataURL("image/jpeg", 1.0)

    const pdf = new jsPDF("p", "mm", "a4")

    const pdfWidth = 210
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width

    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight)

    const fileName = alumno?.nombre
      ? `reporte_${alumno.nombre.replaceAll(" ", "_")}.pdf`
      : "reporte_alumno.pdf"

    pdf.save(fileName)
  }

  return (
    <div style={styles.container}>

      {/* =========================
          VISTA NORMAL
      ========================= */}
      <div className="no-print">

        <h1 style={styles.title}>📄 Estado de Cuenta</h1>

        {alumno && (
          <div style={styles.card}>

            <h2 style={{ margin: 0 }}>👤 {alumno.nombre}</h2>

            <div style={styles.grid}>
              <div style={styles.ingresoBox}>
                📈 Ingresos
                <div style={styles.amount}>S/ {ingresos}</div>
              </div>

              <div style={styles.gastoBox}>
                📉 Gastos
                <div style={styles.amount}>S/ {gastos}</div>
              </div>

              <div style={styles.totalBox}>
                💰 Saldo final
                <div style={styles.amount}>S/ {saldoFinal}</div>
              </div>
            </div>

            <button onClick={print} style={styles.button}>
              🖨 Imprimir
            </button>

            <button onClick={descargarPDF} style={styles.buttonPdf}>
              📥 Descargar PDF
            </button>

          </div>
        )}

        <h3 style={styles.subtitle}>📜 Historial</h3>

        <div style={styles.list}>
          {mov.map(m => (
            <div key={m.id} style={styles.mov}>
              <div>
                <b>{m.concepto}</b>
                <div style={styles.type}>{m.tipo}</div>
              </div>

              <div style={{
                ...styles.money,
                color: m.tipo === "INGRESO" ? "#16a34a" : "#ef4444"
              }}>
                S/ {m.monto}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================
          PDF RENDER (IMPORTANTE)
      ========================= */}
      <div className="print-area">
        <AlumnoReportePrint
          alumno={alumno}
          mov={mov}
          ingresos={ingresos}
          gastos={gastos}
        />
      </div>

      <style>{`
        @media screen {
          .print-area {
            position: absolute;
            left: -9999px;
            top: 0;
          }
        }

        @media print {
          .no-print { display: none; }
          .print-area { display: block; }
        }
      `}</style>

    </div>
  )
}

/* =========================
   🎨 ESTILOS
========================= */
const styles = {

  container: {
    padding: 20,
    fontFamily: "Arial",
    background: "#f4f6fb",
    minHeight: "100vh",
  },

  title: {
    fontSize: 26,
    marginBottom: 15,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "bold",
  },

  card: {
    background: "white",
    padding: 18,
    borderRadius: 14,
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
    marginBottom: 20,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
    marginTop: 10,
  },

  ingresoBox: {
    background: "#ecfdf5",
    border: "1px solid #22c55e",
    padding: 12,
    borderRadius: 12,
  },

  gastoBox: {
    background: "#fef2f2",
    border: "1px solid #ef4444",
    padding: 12,
    borderRadius: 12,
  },

  totalBox: {
    background: "#eff6ff",
    border: "1px solid #3b82f6",
    padding: 12,
    borderRadius: 12,
  },

  amount: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },

  button: {
    marginTop: 10,
    marginRight: 10,
    background: "#111827",
    color: "white",
    border: "none",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
  },

  buttonPdf: {
    marginTop: 10,
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  mov: {
    background: "white",
    padding: 12,
    borderRadius: 12,
    display: "flex",
    justifyContent: "space-between",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },

  type: {
    fontSize: 11,
    color: "#6b7280",
  },

  money: {
    fontWeight: "bold",
    fontSize: 14,
  },
}