import { Link, useLocation, useNavigate } from "react-router-dom"

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  const logout = () => {
    localStorage.removeItem("session")
    navigate("/login")
  }

  return (
    <div style={styles.container}>

      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          💰 Caja Aula
        </div>

        <nav style={styles.nav}>
          <Link style={isActive("/") ? styles.active : styles.link} to="/">
            📊 Dashboard
          </Link>

          <Link style={isActive("/alumnos") ? styles.active : styles.link} to="/alumnos">
            👨‍🎓 Alumnos
          </Link>

          <Link style={isActive("/actividades") ? styles.active : styles.link} to="/actividades">
            🚨 Actividades
          </Link>

          <Link style={isActive("/reportes") ? styles.active : styles.link} to="/reportes">
            🧾 Reportes
          </Link>
        </nav>

        <button onClick={logout} style={styles.logout}>
          🚪 Salir
        </button>
      </aside>

      {/* CONTENIDO */}
      <main style={styles.main}>
        {children}
      </main>

    </div>
  )
}

/* 🎨 ESTILOS */
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Arial",
    background: "#f1f5f9",
  },

  sidebar: {
    width: 220,
    background: "#0f172a",
    color: "white",
    padding: 20,
    display: "flex",
    flexDirection: "column",
  },

  logo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 25,
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    flex: 1,
  },

  link: {
    color: "#cbd5e1",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
  },

  active: {
    background: "#2563eb",
    color: "white",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
  },

  main: {
    flex: 1,
    padding: 20,
  },

  logout: {
    marginTop: "auto",
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: 8,
    cursor: "pointer",
  },
}