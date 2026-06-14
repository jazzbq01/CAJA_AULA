import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from "recharts"

export default function Dashboard() {
  const [total, setTotal] = useState(0)
  const [movimientosMes, setMovimientosMes] = useState([])
  const [alumnosData, setAlumnosData] = useState([])
  const [actividadesMes, setActividadesMes] = useState([])

  /* =========================
     ✅ RESPONSIVE
  ========================= */
  const getWindowWidth = () => {
    if (typeof window === "undefined") return 1200
    return window.innerWidth
  }

  const [anchoPantalla, setAnchoPantalla] = useState(getWindowWidth())

  useEffect(() => {
    const handleResize = () => {
      setAnchoPantalla(getWindowWidth())
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const esMovil = anchoPantalla < 640
  const esTablet = anchoPantalla >= 640 && anchoPantalla < 1024
  const esDesktop = anchoPantalla >= 1024

  const chartHeight = esMovil ? 220 : esTablet ? 240 : 250
  const chartInnerWidth = esMovil ? 520 : "100%"

  const mesesOrden = [
    "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct",
    "Nov", "Dic"
  ]

  const coloresMes = [
    "#60a5fa", "#34d399", "#fbbf24", "#f87171",
    "#a78bfa", "#22c55e", "#f97316", "#3b82f6",
    "#ec4899", "#ef4444"
  ]

  const load = async () => {

    /* =========================
       📊 MOVIMIENTOS
    ========================= */
    const { data: movimientos } = await supabase
      .from("movimientos")
      .select("tipo, monto, alumno_id, created_at")

    const ingresos = (movimientos || [])
      .filter(m => m.tipo === "INGRESO")
      .reduce((a, b) => a + Number(b.monto), 0)

    const gastos = (movimientos || [])
      .filter(m => m.tipo === "GASTO")
      .reduce((a, b) => a + Number(b.monto), 0)

    setTotal(ingresos - gastos)

    /* =========================
       📈 GASTOS POR MES
    ========================= */
    const gastosMes = {}
    mesesOrden.forEach(m => gastosMes[m] = 0)

    ;(movimientos || []).forEach(m => {
      const mes = new Date(m.created_at)
        .toLocaleString("es-PE", { month: "short" })
        .replace(".", "")

      const mesFix = mes.charAt(0).toUpperCase() + mes.slice(1)

      if (gastosMes[mesFix] !== undefined && m.tipo === "GASTO") {
        gastosMes[mesFix] += Number(m.monto)
      }
    })

    setMovimientosMes(
      mesesOrden.map((m, i) => ({
        mes: m,
        gastos: gastosMes[m],
        color: coloresMes[i]
      }))
    )

    /* =========================
       📚 ACTIVIDADES POR MES (NUEVO)
    ========================= */
    const { data: actividades } = await supabase
      .from("actividades")
      .select("created_at")

    const actMes = {}
    mesesOrden.forEach(m => actMes[m] = 0)

    ;(actividades || []).forEach(a => {
      const mes = new Date(a.created_at)
        .toLocaleString("es-PE", { month: "short" })
        .replace(".", "")

      const mesFix = mes.charAt(0).toUpperCase() + mes.slice(1)

      if (actMes[mesFix] !== undefined) {
        actMes[mesFix]++
      }
    })

    setActividadesMes(
      mesesOrden.map((m, i) => ({
        mes: m,
        actividades: actMes[m],
        color: coloresMes[i]
      }))
    )

    /* =========================
       👨‍🎓 ALUMNOS
    ========================= */
    const { data: alumnos } = await supabase
      .from("alumnos")
      .select("id")

    const saldos = {}

    ;(movimientos || []).forEach(m => {
      if (!saldos[m.alumno_id]) saldos[m.alumno_id] = 0

      if (m.tipo === "INGRESO") saldos[m.alumno_id] += Number(m.monto)
      else saldos[m.alumno_id] -= Number(m.monto)
    })

    const conSaldo = (alumnos || []).filter(a => (saldos[a.id] || 0) > 0).length
    const sinSaldo = (alumnos || []).filter(a => (saldos[a.id] || 0) <= 0).length

    setAlumnosData([
      { name: "Con saldo", value: conSaldo },
      { name: "Sin saldo", value: sinSaldo }
    ])
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div
      style={{
        ...styles.container,
        padding: esMovil ? 12 : esTablet ? 16 : 20,
        boxSizing: "border-box",
        overflowX: "hidden"
      }}
    >

      <div
        style={{
          ...styles.pageWrapper,
          maxWidth: esDesktop ? 1200 : "100%",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box"
        }}
      >

        <h1
          style={{
            ...styles.title,
            fontSize: esMovil ? 24 : esTablet ? 28 : 32,
            lineHeight: 1.2
          }}
        >
          📊 Dashboard
        </h1>

        {/* TOTAL */}
        <div
          style={{
            ...styles.totalCard,
            padding: esMovil ? 16 : 20,
            boxSizing: "border-box"
          }}
        >
          <h2
            style={{
              ...styles.cardTitle,
              fontSize: esMovil ? 18 : 22
            }}
          >
            Total Aula
          </h2>
          <h1
            style={{
              ...styles.totalText,
              fontSize: esMovil ? 28 : esTablet ? 34 : 38,
              wordBreak: "break-word"
            }}
          >
            💰 S/ {total}
          </h1>
        </div>

        {/* GASTOS */}
        <div
          style={{
            ...styles.chartCard,
            padding: esMovil ? 14 : 20,
            boxSizing: "border-box"
          }}
        >
          <h3
            style={{
              ...styles.chartTitle,
              fontSize: esMovil ? 17 : 19
            }}
          >
            📊 Gastos por mes
          </h3>

          <div style={styles.chartScroll}>
            <div
              style={{
                width: chartInnerWidth,
                height: chartHeight,
                minWidth: esMovil ? 520 : 0
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movimientosMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: esMovil ? 11 : 12 }}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: esMovil ? 11 : 12 }} />
                  <Tooltip />
                  <Bar dataKey="gastos">
                    {movimientosMes.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 🆕 ACTIVIDADES POR MES */}
        <div
          style={{
            ...styles.chartCard,
            padding: esMovil ? 14 : 20,
            boxSizing: "border-box"
          }}
        >
          <h3
            style={{
              ...styles.chartTitle,
              fontSize: esMovil ? 17 : 19
            }}
          >
            📚 Actividades por mes
          </h3>

          <div style={styles.chartScroll}>
            <div
              style={{
                width: chartInnerWidth,
                height: chartHeight,
                minWidth: esMovil ? 520 : 0
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actividadesMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: esMovil ? 11 : 12 }}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: esMovil ? 11 : 12 }} />
                  <Tooltip />
                  <Bar dataKey="actividades">
                    {actividadesMes.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ALUMNOS */}
        <div
          style={{
            ...styles.chartCard,
            padding: esMovil ? 14 : 20,
            boxSizing: "border-box"
          }}
        >
          <h3
            style={{
              ...styles.chartTitle,
              fontSize: esMovil ? 17 : 19
            }}
          >
            👨‍🎓 Alumnos
          </h3>

          <div style={styles.chartScroll}>
            <div
              style={{
                width: "100%",
                height: chartHeight,
                minWidth: esMovil ? 320 : 0
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alumnosData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: esMovil ? 11 : 12 }}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: esMovil ? 11 : 12 }} />
                  <Tooltip />

                  <Bar dataKey="value">
                    {alumnosData.map((e, i) => (
                      <Cell
                        key={i}
                        fill={e.name === "Con saldo" ? "#22c55e" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

const styles = {
  container: {
    padding: 10,
    fontFamily: "Arial",
    background: "#f4f6fb",
    minHeight: "100vh"
  },

  pageWrapper: {
    width: "100%"
  },

  title: {
    margin: "0 0 18px 0",
    color: "#0f172a",
    fontWeight: "bold"
  },

  totalCard: {
    background: "white",
    padding: 20,
    borderRadius: 14,
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e2e8f0"
  },

  cardTitle: {
    margin: 0,
    color: "#334155"
  },

  totalText: {
    margin: "10px 0 0",
    color: "#0f172a",
    lineHeight: 1.2
  },

  chartCard: {
    background: "white",
    padding: 20,
    borderRadius: 14,
    marginTop: 20,
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e2e8f0"
  },

  chartTitle: {
    margin: "0 0 14px 0",
    color: "#0f172a",
    lineHeight: 1.2
  },

  chartScroll: {
    width: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    WebkitOverflowScrolling: "touch"
  }
}