import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([])
  const [nombre, setNombre] = useState("")
  const [saldo, setSaldo] = useState(0)

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("todos")

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

  const calcSaldo = (movs) => {
    const ingresos =
      movs?.filter(m => m.tipo === "INGRESO")
        .reduce((a, b) => a + Number(b.monto), 0) || 0

    const gastos =
      movs?.filter(m => m.tipo === "GASTO")
        .reduce((a, b) => a + Number(b.monto), 0) || 0

    return ingresos - gastos
  }

  const getEstado = (saldo) => {
    if (saldo <= 0) return "rojo"
    if (saldo < 10) return "ambar"
    return "verde"
  }

  const getTheme = (estado) => {
    if (estado === "rojo") {
      return { bg: "#fff1f2", border: "#ef4444", btn: "#ef4444" }
    }
    if (estado === "ambar") {
      return { bg: "#fffbeb", border: "#f59e0b", btn: "#d97706" }
    }
    return { bg: "#f0fdf4", border: "#22c55e", btn: "#16a34a" }
  }

  const getEstadoLabel = (estado) => {
    if (estado === "rojo") return "SIN SALDO"
    if (estado === "ambar") return "POCO SALDO"
    return "CON SALDO"
  }

  /* =========================
     ✅ CREAR ALUMNO (ARREGLADO)
  ========================= */
  const crearAlumno = async () => {
    if (!nombre) return

    const { data, error } = await supabase
      .from("alumnos")
      .insert([{ nombre }])
      .select()

    if (error) {
      console.log(error)
      return
    }

    const alumno = data?.[0]

    if (alumno && Number(saldo) > 0) {
      await supabase.from("movimientos").insert([
        {
          alumno_id: alumno.id,
          tipo: "INGRESO",
          monto: Number(saldo),
        },
      ])
    }

    setNombre("")
    setSaldo(0)
    load()
  }

  /* =========================
     ✅ AGREGAR SALDO (ARREGLADO)
  ========================= */
  const agregarSaldo = async (alumnoId) => {
    const monto = prompt("Monto a agregar:")
    if (!monto) return

    await supabase.from("movimientos").insert([
      {
        alumno_id: alumnoId,
        tipo: "INGRESO",
        monto: Number(monto),
      },
    ])

    load()
  }

  const filteredAlumnos = alumnos.filter((a) => {
    const saldoFinal = calcSaldo(a.movimientos)
    const estado = getEstado(saldoFinal)

    const matchSearch =
      a.nombre.toLowerCase().includes(search.toLowerCase())

    const matchFilter =
      filter === "todos" ||
      (filter === "con" && estado === "verde") ||
      (filter === "sin" && estado === "rojo") ||
      (filter === "riesgo" && estado === "ambar")

    return matchSearch && matchFilter
  })

  return (
    <div
      style={{
        ...styles.container,
        padding: isMobile ? 12 : isTablet ? 16 : 20,
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          marginBottom: 10,
          fontSize: isMobile ? 24 : 32,
          lineHeight: 1.2,
        }}
      >
        👨‍🎓 Alumnos
      </h1>

      {/* FILTROS */}
      <div
        style={{
          ...styles.filters,
          width: "100%",
        }}
      >
        <input
          placeholder="🔎 Buscar alumno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            ...styles.search,
            width: "100%",
            boxSizing: "border-box",
            fontSize: isMobile ? 14 : 15,
          }}
        />

        <div
          style={{
            ...styles.filterButtons,
            ...(isMobile
              ? {
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  width: "100%",
                }
              : {
                  flexWrap: "wrap",
                }),
          }}
        >
          {["todos", "con", "sin", "riesgo"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterBtn,
                background: filter === f ? "#111827" : "white",
                color: filter === f ? "white" : "#111827",
                width: isMobile ? "100%" : "auto",
                whiteSpace: "nowrap",
              }}
            >
              {f === "todos"
                ? "Todos"
                : f === "con"
                ? "Con saldo"
                : f === "sin"
                ? "Sin saldo"
                : "Poco saldo"}
            </button>
          ))}
        </div>
      </div>

      {/* FORM */}
      <div
        style={{
          ...styles.formCard,
          padding: isMobile ? 14 : 18,
        }}
      >
        
        <div style={styles.formHeader}>
          <h3
            style={{
              margin: 0,
              fontSize: isMobile ? 17 : 20,
            }}
          >
            ➕ Crear alumno
          </h3>
          <span
            style={{
              ...styles.formHint,
              display: "block",
              marginTop: 4,
              lineHeight: 1.4,
            }}
          >
            Completa los datos para registrar un nuevo alumno
          </span>
        </div>

        <div
          style={{
            ...styles.formGrid,
            gridTemplateColumns: isMobile
              ? "1fr"
              : isTablet
              ? "1fr 1fr"
              : "2fr 1fr auto",
          }}
        >

          {/* NOMBRE */}
          <div style={styles.field}>
            <label style={styles.label}>Nombre</label>
            <input
              placeholder="Nombre alumno"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{
                ...styles.input,
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* SALDO */}
          <div style={styles.field}>
            <label style={styles.label}>Saldo inicial</label>
            <input
              type="number"
              placeholder="0"
              value={saldo}
              onChange={(e) => setSaldo(e.target.value)}
              style={{
                ...styles.input,
                width: "100%",
                boxSizing: "border-box",
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
              onClick={crearAlumno}
              style={{
                ...styles.createBtn,
                width: isMobile || isTablet ? "100%" : "auto",
              }}
            >
              ➕ Agregar Alumno
            </button>
          </div>

        </div>
      </div>

      {/* LISTA */}
      <div style={styles.list}>
        {filteredAlumnos.map((a) => {
          const saldoFinal = calcSaldo(a.movimientos)
          const estado = getEstado(saldoFinal)
          const theme = getTheme(estado)

          return (
            <div
              key={a.id}
              style={{
                ...styles.card,
                background: theme.bg,
                borderLeft: `6px solid ${theme.border}`,
                padding: isMobile ? 14 : 16,
                boxSizing: "border-box",
              }}
            >

              <div
                style={{
                  ...styles.header,
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? 10 : 0,
                  alignItems: isMobile ? "flex-start" : "flex-start",
                }}
              >
                <div style={{ width: "100%" }}>
                  <div
                    style={{
                      ...styles.name,
                      fontSize: isMobile ? 16 : 18,
                      wordBreak: "break-word",
                    }}
                  >
                    {a.nombre}
                  </div>
                  <div
                    style={{
                      ...styles.saldo,
                      fontSize: isMobile ? 13 : 14,
                    }}
                  >
                    💰 Saldo: <b>S/ {saldoFinal}</b>
                  </div>
                </div>

                <div style={{
                  ...styles.badge,
                  background: "#ffffff90",
                  color: theme.border,
                  border: `1px solid ${theme.border}`,
                  alignSelf: isMobile ? "flex-start" : "auto",
                  whiteSpace: "nowrap",
                }}>
                  {getEstadoLabel(estado)}
                </div>
              </div>

              <div
                style={{
                  ...styles.footer,
                  justifyContent: isMobile ? "stretch" : "flex-end",
                }}
              >
                <button
                  onClick={() => agregarSaldo(a.id)}
                  style={{
                    ...styles.addBtn,
                    background: theme.btn,
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  + Agregar saldo
                </button>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}

/* estilos intactos */
const styles = {
  container: { padding: 20, fontFamily: "Arial", background: "#f4f6fb" },
  filters: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 15 },
  search: { padding: 10, borderRadius: 10, border: "1px solid #ddd" },
  filterButtons: { display: "flex", gap: 10 },
  filterBtn: { padding: "6px 12px", borderRadius: 20, border: "1px solid #ddd", cursor: "pointer", fontSize: 12 },
  form: { display: "flex", gap: 10, marginBottom: 20 },
  input: { padding: 10, borderRadius: 10, border: "1px solid #ddd", flex: 1 },
  createBtn: { background: "#2563eb", color: "white", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: "bold" },
  list: { display: "flex", flexDirection: "column", gap: 14 },
  card: { padding: 16, borderRadius: 16, boxShadow: "0 3px 12px rgba(0,0,0,0.05)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  footer: { display: "flex", justifyContent: "flex-end", marginTop: 10 },
  name: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  saldo: { fontSize: 14, opacity: 0.8 },
  badge: { padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: "bold" },
  addBtn: { color: "white", border: "none", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: "bold" },
formCard: {
  background: "white",
  borderRadius: 16,
  padding: 18,
  marginBottom: 20,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  border: "1px solid #eef0f5",
},

formHeader: {
  marginBottom: 12,
},

formHint: {
  fontSize: 12,
  color: "#6b7280",
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