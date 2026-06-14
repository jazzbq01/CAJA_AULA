import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

export default function Reportes() {
  const [alumnos, setAlumnos] = useState([])
  const [search, setSearch] = useState("")
  const navigate = useNavigate()

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
      .from("alumnos")
      .select("id, nombre")

    setAlumnos(data || [])
  }

  /* 🔥 SOLO FILTRO POR NOMBRE */
  const filtered = alumnos.filter((a) =>
    a.nombre.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      style={{
        ...styles.container,
        padding: isMobile ? 12 : isTablet ? 16 : 20,
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >

      {/* HEADER */}
      <div
        style={{
          ...styles.header,
          maxWidth: 1100,
          margin: "0 auto 20px auto",
        }}
      >
        <h1
          style={{
            ...styles.title,
            fontSize: isMobile ? 24 : 26,
            lineHeight: 1.2,
          }}
        >
          📊 Reportes
        </h1>
        <p
          style={{
            ...styles.subtitle,
            fontSize: isMobile ? 12 : 13,
            lineHeight: 1.4,
          }}
        >
          Gestión de alumnos y análisis de información
        </p>
      </div>

      {/* SEARCH (SOLO ESTO SE QUEDA) */}
      <div
        style={{
          ...styles.panel,
          maxWidth: 1100,
          margin: "0 auto 20px auto",
          padding: isMobile ? 12 : 14,
          boxSizing: "border-box",
        }}
      >
        <input
          placeholder="🔎 Buscar alumno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            ...styles.search,
            fontSize: isMobile ? 14 : 15,
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* LISTA */}
      <div
        style={{
          ...styles.list,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {filtered.map((a) => (
          <div
            key={a.id}
            style={{
              ...styles.card,
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
              gap: isMobile ? 12 : 10,
              padding: isMobile ? 12 : 14,
              boxSizing: "border-box",
            }}
          >

            <div
              style={{
                ...styles.left,
                width: "100%",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  ...styles.avatar,
                  width: isMobile ? 36 : 38,
                  height: isMobile ? 36 : 38,
                  minWidth: isMobile ? 36 : 38,
                  fontSize: isMobile ? 17 : 18,
                }}
              >
                👤
              </div>

              <div
                style={{
                  minWidth: 0,
                  width: "100%",
                }}
              >
                <div
                  style={{
                    ...styles.name,
                    fontSize: isMobile ? 14 : 15,
                    wordBreak: "break-word",
                    lineHeight: 1.3,
                  }}
                >
                  {a.nombre}
                </div>
                <div
                  style={{
                    ...styles.meta,
                    fontSize: isMobile ? 11 : 12,
                  }}
                >
                  Alumno registrado
                </div>
              </div>
            </div>

            <button
              style={{
                ...styles.button,
                width: isMobile ? "100%" : "auto",
                minHeight: isMobile ? 42 : "auto",
                whiteSpace: "nowrap",
              }}
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