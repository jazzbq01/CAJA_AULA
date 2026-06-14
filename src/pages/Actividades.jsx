import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export default function Actividades() {
  const [nombre, setNombre] = useState("")
  const [monto, setMonto] = useState(0)
  const [gastos, setGastos] = useState([])

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
    <div
      style={{
        ...styles.container,
        padding: isMobile ? 12 : isTablet ? 16 : 20,
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            ...styles.title,
            fontSize: isMobile ? 23 : isTablet ? 25 : 26,
            lineHeight: 1.2,
            marginBottom: isMobile ? 14 : 20,
          }}
        >
          📉 Actividades (Gastos)
        </h1>

        {/* FORM */}
        <div
          style={{
            ...styles.formCard,
            padding: isMobile ? 14 : isTablet ? 16 : 18,
            boxSizing: "border-box",
          }}
        >

          {/* HEADER DEL BLOQUE */}
          <div style={styles.formHeader}>
            <div>
              <h3
                style={{
                  ...styles.formTitle,
                  fontSize: isMobile ? 17 : 18,
                  lineHeight: 1.2,
                }}
              >
                ➕ Registrar actividad
              </h3>
              <p
                style={{
                  ...styles.formSubtitle,
                  lineHeight: 1.4,
                }}
              >
                Agrega un gasto que será distribuido automáticamente
              </p>
            </div>
          </div>

          {/* INPUTS */}
          <div
            style={{
              ...styles.formGrid,
              gridTemplateColumns: isMobile
                ? "1fr"
                : isTablet
                ? "1fr 1fr"
                : "2fr 1fr auto",
              gap: isMobile ? 10 : 12,
            }}
          >

            {/* NOMBRE */}
            <div style={styles.field}>
              <label style={styles.label}>Actividad</label>
              <input
                placeholder="Ej: Paseo, material, celebración..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={{
                  ...styles.inputNombre,
                  width: "100%",
                  minWidth: 0,
                  boxSizing: "border-box",
                  fontSize: isMobile ? 14 : 15,
                }}
              />
            </div>

            {/* MONTO */}
            <div style={styles.field}>
              <label style={styles.label}>Monto</label>
              <input
                type="number"
                placeholder="S/ 0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                style={{
                  ...styles.input,
                  width: "100%",
                  boxSizing: "border-box",
                  fontSize: isMobile ? 14 : 15,
                }}
              />
            </div>

            {/* BOTÓN */}
            <div
              style={{
                ...styles.buttonBox,
                gridColumn: isMobile || isTablet ? "1 / -1" : "auto",
                width: "100%",
              }}
            >
              <button
                onClick={aplicarGasto}
                style={{
                  ...styles.button,
                  width: isMobile || isTablet ? "100%" : "auto",
                  minHeight: isMobile ? 42 : "auto",
                  boxSizing: "border-box",
                }}
              >
                ➖ Registrar gasto
              </button>
            </div>

          </div>

        </div>

        {/* LISTA DE GASTOS */}
        <h3
          style={{
            marginTop: 20,
            fontSize: isMobile ? 18 : 20,
            lineHeight: 1.2,
          }}
        >
          📜 Historial de gastos
        </h3>

        {gastos.length === 0 && (
          <p
            style={{
              color: "#6b7280",
              fontSize: isMobile ? 14 : 15,
            }}
          >
            No hay gastos registrados aún
          </p>
        )}

        {gastos.map((g) => (
          <div
            key={g.id}
            style={{
              ...styles.card,
              padding: isMobile ? 12 : 12,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                ...styles.row,
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 6 : 10,
                alignItems: isMobile ? "flex-start" : "center",
              }}
            >
              <b
                style={{
                  wordBreak: "break-word",
                  lineHeight: 1.3,
                  fontSize: isMobile ? 14 : 15,
                }}
              >
                🧾 {g.nombre}
              </b>
              <span
                style={{
                  ...styles.monto,
                  alignSelf: isMobile ? "flex-end" : "center",
                  whiteSpace: "nowrap",
                  fontSize: isMobile ? 14 : 15,
                }}
              >
                - S/ {g.monto}
              </span>
            </div>

            <div
              style={{
                ...styles.fecha,
                fontSize: isMobile ? 11 : 12,
                lineHeight: 1.3,
              }}
            >
              📅 {new Date(g.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
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
    width: "80%",
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
  formCard: {
  background: "linear-gradient(135deg, #ffffff, #f8fafc)",
  padding: 18,
  borderRadius: 16,
  boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  border: "1px solid #eef2f7",
  marginBottom: 20,
},

formHeader: {
  marginBottom: 12,
},

formTitle: {
  margin: 0,
  fontSize: 18,
  fontWeight: "bold",
},

formSubtitle: {
  margin: 0,
  fontSize: 12,
  color: "#6b7280",
  marginTop: 4,
},

formGrid: {
  display: "grid",
  gridTemplateColumns: "2fr 1fr auto",
  gap: 12,
  alignItems: "end",
},

field: {
  display: "flex",
  flexDirection: "column",
  gap: 6,
},

label: {
  fontSize: 12,
  fontWeight: "bold",
  color: "#374151",
},

buttonBox: {
  display: "flex",
  alignItems: "end",
},
}