import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

export default function Reportes() {
  const [alumnos, setAlumnos] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data } = await supabase
      .from("alumnos")
      .select("id, nombre")

    setAlumnos(data || [])
  }

  return (
    <div style={styles.container}>
      <h1>📊 Reportes</h1>

      {alumnos.map((a) => (
        <div key={a.id} style={styles.card}>
          <span>👤 {a.nombre}</span>

          <button
            style={styles.button}
            onClick={() => navigate(`/alumnos/${a.id}`)}
          >
            Ver detalle
          </button>
        </div>
      ))}
    </div>
  )
}

const styles = {
  container: {
    padding: 20,
    fontFamily: "Arial",
  },

  card: {
    background: "white",
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  button: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
  },
}