import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export default function Actividades() {
  const [nombre, setNombre] = useState("")
  const [monto, setMonto] = useState(0)
  const [gastos, setGastos] = useState([])

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data } = await supabase
      .from("actividades")
      .select("*")
      .order("created_at", { ascending: false })

    setGastos(data || [])
  }

// const aplicarGasto = async () => {
//   if (!nombre || !monto) return

//   // 1. guardar actividad (historial global)
//   await supabase.from("actividades").insert([
//     {
//       nombre,
//       monto: Number(monto),
//     },
//   ])

//   // 2. obtener alumnos
//   const { data: alumnos } = await supabase
//     .from("alumnos")
//     .select("id")

//   // 3. registrar gasto en movimientos (ESTO ES LO IMPORTANTE)
//   const movimientos = alumnos.map((a) => ({
//     alumno_id: a.id,
//     tipo: "GASTO",
//     concepto: nombre,
//     monto: Number(monto),
//   }))

//   await supabase.from("movimientos").insert(movimientos)

//   setNombre("")
//   setMonto(0)
//   load()
// }

const aplicarGasto = async () => {
  if (!nombre || !monto) return

  const gasto = Number(monto)

  // 1. guardar actividad global
  await supabase.from("actividades").insert([
    { nombre, monto: gasto }
  ])

  // 2. obtener alumnos con saldo actual
  const { data: alumnos } = await supabase
    .from("movimientos")
    .select("alumno_id, tipo, monto")

  // 3. calcular saldo por alumno
  const saldos = {}

  alumnos.forEach(m => {
    if (!saldos[m.alumno_id]) saldos[m.alumno_id] = 0

    if (m.tipo === "INGRESO") {
      saldos[m.alumno_id] += m.monto
    } else {
      saldos[m.alumno_id] -= m.monto
    }
  })

  // 4. SOLO alumnos con saldo positivo
  const afectados = Object.keys(saldos).filter(
    id => saldos[id] > 0
  )

  // 5. aplicar gasto solo a ellos
  const movimientos = afectados.map((id) => ({
    alumno_id: id,
    tipo: "GASTO",
    concepto: nombre,
    monto: gasto,
    created_at: new Date().toISOString()
  }))

  if (movimientos.length === 0) {
    alert("No hay alumnos con saldo disponible")
    return
  }

  await supabase.from("movimientos").insert(movimientos)

  setNombre("")
  setMonto(0)
  load()
}

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📉 Actividades (Gastos)</h1>

      {/* FORM */}
      <div style={styles.form}>
        <input
          placeholder="Nombre actividad (ej: Paseo, material, etc)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={styles.inputNombre}
        />

        <input
          type="number"
          placeholder="Monto S/"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          style={styles.input}
        />

        <button onClick={aplicarGasto} style={styles.button}>
          ➖ Registrar gasto
        </button>
      </div>

      {/* LISTA DE GASTOS */}
      <h3 style={{ marginTop: 20 }}>📜 Historial de gastos</h3>

      {gastos.length === 0 && (
        <p style={{ color: "#6b7280" }}>
          No hay gastos registrados aún
        </p>
      )}

      {gastos.map((g) => (
        <div key={g.id} style={styles.card}>
          <div style={styles.row}>
            <b>🧾 {g.nombre}</b>
            <span style={styles.monto}>- S/ {g.monto}</span>
          </div>

          <div style={styles.fecha}>
            📅 {new Date(g.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}

/* =========================
   🎨 ESTILOS MODERNOS
========================= */
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

  form: {
    background: "white",
    padding: 15,
    borderRadius: 12,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    outline: "none",
  },

  inputNombre: {
    width: "60%",
    minWidth: "200px",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    outline: "none",
  },

  button: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
  },

  card: {
    background: "white",
    padding: 12,
    marginTop: 10,
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
  },

  monto: {
    color: "#ef4444",
    fontWeight: "bold",
  },

  fecha: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 5,
  },
}