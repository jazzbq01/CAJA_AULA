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
    <div style={{ padding: 10 }}>

      <h1>📊 Dashboard</h1>

      {/* TOTAL */}
      <div style={{ background: "white", padding: 20, borderRadius: 10 }}>
        <h2>Total Aula</h2>
        <h1>💰 S/ {total}</h1>
      </div>

      {/* GASTOS */}
      <div style={{ background: "white", padding: 20, borderRadius: 10, marginTop: 20 }}>
        <h3>📊 Gastos por mes</h3>

        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer>
            <BarChart data={movimientosMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
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

      {/* 🆕 ACTIVIDADES POR MES */}
      <div style={{ background: "white", padding: 20, borderRadius: 10, marginTop: 20 }}>
        <h3>📚 Actividades por mes</h3>

        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer>
            <BarChart data={actividadesMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
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

      {/* ALUMNOS */}
      <div style={{ background: "white", padding: 20, borderRadius: 10, marginTop: 20 }}>
        <h3>👨‍🎓 Alumnos</h3>

        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer>
            <BarChart data={alumnosData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
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
  )
}