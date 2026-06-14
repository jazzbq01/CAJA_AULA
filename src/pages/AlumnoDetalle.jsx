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

  /* =========================
     ✅ RESPONSIVE
  ========================= */
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  )

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)

    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const isMobile = windowWidth <= 600
  const isTablet = windowWidth > 600 && windowWidth <= 900

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
    <div
      style={{
        ...styles.container,
        padding: isMobile ? 12 : isTablet ? 16 : 20,
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >

      {/* =========================
          VISTA NORMAL
      ========================= */}
      <div
        className="no-print"
        style={{
          width: "100%",
          maxWidth: 1100,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >

        <h1
          style={{
            ...styles.title,
            fontSize: isMobile ? 24 : isTablet ? 25 : 26,
            lineHeight: 1.2,
          }}
        >
          📄 Estado de Cuenta
        </h1>

        {alumno && (
          <div
            style={{
              ...styles.card,
              padding: isMobile ? 14 : 18,
              boxSizing: "border-box",
            }}
          >

            <h2
              style={{
                margin: 0,
                fontSize: isMobile ? 20 : 24,
                lineHeight: 1.2,
                wordBreak: "break-word",
              }}
            >
              👤 {alumno.nombre}
            </h2>

            <div
              style={{
                ...styles.grid,
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : isTablet
                  ? "1fr 1fr"
                  : "1fr 1fr 1fr",
              }}
            >
              <div style={styles.ingresoBox}>
                📈 Ingresos
                <div
                  style={{
                    ...styles.amount,
                    fontSize: isMobile ? 17 : 18,
                  }}
                >
                  S/ {ingresos}
                </div>
              </div>

              <div style={styles.gastoBox}>
                📉 Gastos
                <div
                  style={{
                    ...styles.amount,
                    fontSize: isMobile ? 17 : 18,
                  }}
                >
                  S/ {gastos}
                </div>
              </div>

              <div
                style={{
                  ...styles.totalBox,
                  gridColumn: isTablet ? "1 / -1" : "auto",
                }}
              >
                💰 Saldo final
                <div
                  style={{
                    ...styles.amount,
                    fontSize: isMobile ? 17 : 18,
                  }}
                >
                  S/ {saldoFinal}
                </div>
              </div>
            </div>

            <div
              style={{
                ...styles.actions,
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 8 : 10,
              }}
            >
              <button
                onClick={print}
                style={{
                  ...styles.button,
                  width: isMobile ? "100%" : "auto",
                  marginRight: isMobile ? 0 : 10,
                  boxSizing: "border-box",
                }}
              >
                🖨 Imprimir
              </button>

              <button
                onClick={descargarPDF}
                style={{
                  ...styles.buttonPdf,
                  width: isMobile ? "100%" : "auto",
                  boxSizing: "border-box",
                }}
              >
                📥 Descargar PDF
              </button>
            </div>

          </div>
        )}

        <h3
          style={{
            ...styles.subtitle,
            fontSize: isMobile ? 18 : 20,
          }}
        >
          📜 Historial
        </h3>

        <div style={styles.list}>
          {mov.map(m => (
            <div
              key={m.id}
              style={{
                ...styles.mov,
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "flex-start" : "center",
                gap: isMobile ? 8 : 10,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <b
                  style={{
                    wordBreak: "break-word",
                    fontSize: isMobile ? 14 : 15,
                  }}
                >
                  {m.concepto}
                </b>
                <div style={styles.type}>{m.tipo}</div>
              </div>

              <div style={{
                ...styles.money,
                color: m.tipo === "INGRESO" ? "#16a34a" : "#ef4444",
                alignSelf: isMobile ? "flex-end" : "center",
                whiteSpace: "nowrap",
                fontSize: isMobile ? 14 : 14,
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
            width: 794px;
            background: white;
          }
        }

        @media print {
          .no-print { display: none; }
          .print-area { display: block; }
        }

        * {
          box-sizing: border-box;
        }

        @media screen and (max-width: 600px) {
          body {
            margin: 0;
            overflow-x: hidden;
          }

          button {
            min-height: 42px;
          }
        }

        @media screen and (min-width: 601px) and (max-width: 900px) {
          body {
            margin: 0;
          }
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

  actions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 10,
  },
}