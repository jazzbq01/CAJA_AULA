import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export default function Dashboard() {
  const [total, setTotal] = useState(0)

  const load = async () => {
    const { data } = await supabase
      .from("movimientos")
      .select("tipo, monto")

    const ingresos = (data || [])
      .filter(m => m.tipo === "INGRESO")
      .reduce((a, b) => a + b.monto, 0)

    const gastos = (data || [])
      .filter(m => m.tipo === "GASTO")
      .reduce((a, b) => a + b.monto, 0)

    setTotal(ingresos - gastos)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <h1>📊 Dashboard</h1>

      <div style={{
        background: "white",
        padding: 20,
        borderRadius: 10
      }}>
        <h2>Total Aula</h2>
        <h1>💰 S/ {total}</h1>
      </div>
    </div>
  )
}