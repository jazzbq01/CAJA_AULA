import { Link, useLocation, useNavigate } from "react-router-dom"
import { useState } from "react"

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const logout = () => {
    localStorage.removeItem("session")
    navigate("/login")
  }

  return (
    <div style={styles.container}>

      {/* TOPBAR */}
      <div style={styles.topbar}>
        <button onClick={() => setOpen(true)} style={styles.menuBtn}>
          ☰
        </button>

        <span style={styles.title}>Caja Aula</span>
      </div>

      {/* OVERLAY */}
      {open && (
        <div
          style={styles.overlay}
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        style={{
          ...styles.sidebar,
          left: open ? "0" : "-260px",
        }}
      >
        <div style={styles.logo}>💰 Caja Aula</div>

        <div style={styles.navContainer}>
          <nav style={styles.nav}>

            <Link onClick={() => setOpen(false)} to="/"
              style={isActive("/") ? styles.active : styles.link}>
              📊 Dashboard
            </Link>

            <Link onClick={() => setOpen(false)} to="/alumnos"
              style={isActive("/alumnos") ? styles.active : styles.link}>
              👨‍🎓 Alumnos
            </Link>

            <Link onClick={() => setOpen(false)} to="/actividades"
              style={isActive("/actividades") ? styles.active : styles.link}>
              🚨 Actividades
            </Link>

            <Link onClick={() => setOpen(false)} to="/reportes"
              style={isActive("/reportes") ? styles.active : styles.link}>
              🧾 Reportes
            </Link>

          </nav>
        </div>

        {/* LOGOUT SIEMPRE VISIBLE */}
        <div style={styles.logoutContainer}>
          <button onClick={logout} style={styles.logout}>
            🚪 Cerrar sesión
          </button>
        </div>

      </aside>

      {/* CONTENIDO */}
      <main style={styles.main}>
        {children}
      </main>

    </div>
  )
}

/* ESTILOS */
const styles = {
  container: {
    fontFamily: "Arial",
    minHeight: "100vh",
    background: "#f1f5f9",
  },

  topbar: {
    height: 55,
    background: "#0f172a",
    color: "white",
    display: "flex",
    alignItems: "center",
    padding: "0 15px",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    zIndex: 1000,
  },

  menuBtn: {
    fontSize: 22,
    background: "none",
    border: "none",
    color: "white",
  },

  title: {
    fontWeight: "bold",
    marginLeft: 10,
  },

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.4)",
    zIndex: 998,
  },

  sidebar: {
    position: "fixed",
    top: 55,
    left: 0,
    width: 240,
      height: "calc(100vh - 100px)",
    background: "#0f172a",
    color: "white",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    transition: "0.3s ease",
    zIndex: 999,
  },

  logo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 25,
  },

  navContainer: {
  flex: 1,
  overflowY: "auto",
  minHeight: 0, // 🔥 CRÍTICO EN FLEX
},

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  link: {
    color: "#cbd5e1",
    textDecoration: "none",
    padding: 10,
    borderRadius: 8,
  },

  active: {
    background: "#2563eb",
    color: "white",
    padding: 10,
    borderRadius: 8,
    textDecoration: "none",
  },

  logoutContainer: {
    marginTop: "auto",
    borderTop: "1px solid rgba(255,255,255,0.15)",
    paddingTop: 10,
  },

  logout: {
    width: "100%",
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: 10,
    borderRadius: 8,
    fontWeight: "bold",
  },

  main: {
    marginTop: 55,
    padding: 20,
  },
}