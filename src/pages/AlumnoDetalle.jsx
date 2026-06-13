import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"
import AlumnoReportePrint from "./AlumnoReportePrint"

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
    .reduce((a, b) => a + b.monto, 0)

  const gastos = mov
    .filter(m => m.tipo === "GASTO")
    .reduce((a, b) => a + b.monto, 0)

  const saldoFinal = ingresos - gastos

  const print = () => window.print()

return (
  <div>

    {/* 👇 VISTA NORMAL */}
    <div className="no-print">
      <h1>📄 Estado de Cuenta</h1>

      {alumno && (
        <div style={styles.card}>
          <h2>👤 {alumno.nombre}</h2>

          <div>📈 Ingresos: S/ {ingresos}</div>
          <div>📉 Gastos: S/ {gastos}</div>
          <div><b>💰 Saldo final: S/ {saldoFinal}</b></div>

          <button onClick={() => window.print()} style={styles.button}>
            🖨 Imprimir
          </button>
        </div>
      )}

      <h3>📜 Historial</h3>

      {mov.map(m => (
        <div key={m.id} style={styles.mov}>
          <b>{m.concepto}</b> - {m.tipo} - S/ {m.monto}
        </div>
      ))}
    </div>

    {/* 👇 VISTA SOLO IMPRESIÓN */}
    <div className="print-only">
      <AlumnoReportePrint
        alumno={alumno}
        mov={mov}
        ingresos={ingresos}
        gastos={gastos}
      />
    </div>

    {/* 🧠 CONTROL DE VISIBILIDAD */}
    <style>{`
      @media screen {
        .print-only {
          display: none;
        }
      }

      @media print {
        .no-print {
          display: none;
        }

        .print-only {
          display: block;
        }
      }
    `}</style>

  </div>
)
}

const styles = {
  container: {
    padding: 20,
    fontFamily: "Arial",
    background: "#f4f6fb",
  },

  card: {
    background: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },

  mov: {
    background: "white",
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
  },

  button: {
    marginTop: 10,
    background: "#111827",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: 8,
    cursor: "pointer",
  },
}