import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { Link } from "react-router-dom"

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([])
  const [nombre, setNombre] = useState("")
  const [saldo, setSaldo] = useState(0)

  const load = async () => {
    const { data } = await supabase
      .from("alumnos")
      .select(`
        id,
        nombre,
        movimientos (
          tipo,
          monto
        )
      `)

    setAlumnos(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const crear = async () => {
    if (!nombre) return

    const { data } = await supabase
      .from("alumnos")
      .insert([{ nombre }])
      .select()

    const a = data?.[0]

    if (a) {
      await supabase.from("movimientos").insert([
        {
          alumno_id: a.id,
          tipo: "INGRESO",
          concepto: "Saldo inicial",
          monto: Number(saldo),
        },
      ])
    }

    setNombre("")
    setSaldo(0)
    load()
  }

  const addSaldo = async (id) => {
    const monto = prompt("Monto adicional")
    if (!monto) return

    await supabase.from("movimientos").insert([
      {
        alumno_id: id,
        tipo: "INGRESO",
        concepto: "Saldo adicional",
        monto: Number(monto),
      },
    ])

    load()
  }

  const calcSaldo = (movs) => {
    const ingresos =
      movs?.filter((m) => m.tipo === "INGRESO")
        .reduce((a, b) => a + b.monto, 0) || 0

    const gastos =
      movs?.filter((m) => m.tipo === "GASTO")
        .reduce((a, b) => a + b.monto, 0) || 0

    return ingresos - gastos
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>👨‍🎓 Alumnos</h1>

      {/* FORM */}
      <div style={styles.formBox}>
  
      {/* NOMBRE */}
      <div style={styles.field}>
        <label style={styles.label}>👤 Nombre del alumno</label>
        <input
          placeholder="Ej: Miguelito Pérez"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* SALDO */}
      <div style={styles.field}>
        <label style={styles.label}>💰 Saldo inicial (S/)</label>
        <input
          type="number"
          placeholder="Ej: 100"
          value={saldo}
          onChange={(e) => setSaldo(e.target.value)}
          style={styles.input}
        />
        <small style={styles.help}>
          Este será el saldo base del alumno
        </small>
      </div>

      {/* BOTÓN */}
      <button onClick={crear} style={styles.button}>
        ➕ Crear alumno
      </button>

    </div>

      {/* LISTA */}
      {alumnos.map((a) => {
        const saldoFinal = calcSaldo(a.movimientos)

        return (
          <div key={a.id} style={styles.card}>
            
            <Link to={`/alumnos/${a.id}`} style={styles.name}>
              {a.nombre}
            </Link>

            <button
              onClick={() => addSaldo(a.id)}
              style={styles.addButton}
            >
              ➕ Agregar saldo
            </button>

            <div style={styles.saldo}>
              💰 Saldo actual: <b>S/ {saldoFinal}</b>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* =======================
   🎨 ESTILOS PRO
======================= */
const styles = {
  container: {
    padding: 20,
    fontFamily: "Arial",
    background: "#f4f6fb",
    minHeight: "100vh",
  },

  title: {
    marginBottom: 20,
    fontSize: 26,
  },

  formBox: {
    background: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },

  label: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#111827",
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    outline: "none",
  },

  help: {
    fontSize: 12,
    color: "#6b7280",
  },

  button: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
  },

  card: {
    background: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
    textDecoration: "none",
    color: "#111827",
  },

  addButton: {
    background: "#10b981",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
    width: "fit-content",
  },

  saldo: {
    marginTop: 5,
    color: "#111827",
  },
}