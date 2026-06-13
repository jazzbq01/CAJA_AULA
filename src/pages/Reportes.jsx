import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

export default function Reportes() {
  const [alumnos, setAlumnos] = useState([])
  const [search, setSearch] = useState("")
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

  /* 🔥 SOLO FILTRO POR NOMBRE */
  const filtered = alumnos.filter((a) =>
    a.nombre.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>📊 Reportes</h1>
        <p style={styles.subtitle}>
          Gestión de alumnos y análisis de información
        </p>
      </div>

      {/* SEARCH (SOLO ESTO SE QUEDA) */}
      <div style={styles.panel}>
        <input
          placeholder="🔎 Buscar alumno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      </div>

      {/* LISTA */}
      <div style={styles.list}>
        {filtered.map((a) => (
          <div key={a.id} style={styles.card}>

            <div style={styles.left}>
              <div style={styles.avatar}>👤</div>

              <div>
                <div style={styles.name}>{a.nombre}</div>
                <div style={styles.meta}>Alumno registrado</div>
              </div>
            </div>

            <button
              style={styles.button}
              onClick={() => navigate(`/alumnos/${a.id}`)}
            >
              Ver detalle →
            </button>

          </div>
        ))}
      </div>

    </div>
  )
}

/* =========================
   🎨 UI (SIN FILTROS EXTRA)
========================= */
const styles = {

  container: {
    padding: 20,
    fontFamily: "Arial",
    background: "#f4f6fb",
    minHeight: "100vh",
  },

  header: {
    marginBottom: 20,
  },

  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: "bold",
  },

  subtitle: {
    margin: 0,
    color: "#6b7280",
    fontSize: 13,
  },

  panel: {
    background: "white",
    padding: 14,
    borderRadius: 14,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
    marginBottom: 20,
  },

  search: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    outline: "none",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  card: {
    background: "white",
    padding: 14,
    borderRadius: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
    transition: "0.2s",
  },

  left: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: "#e0e7ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },

  name: {
    fontWeight: "bold",
  },

  meta: {
    fontSize: 12,
    color: "#6b7280",
  },

  button: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: "bold",
  },
}