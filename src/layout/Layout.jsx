import { Link, useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

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

  const esMovil = anchoPantalla < 768
  const esTablet = anchoPantalla >= 768 && anchoPantalla < 1024
  const esDesktop = anchoPantalla >= 1024

  const sidebarWidth = esMovil ? 260 : esTablet ? 260 : 280
  const sidebarRealWidth = esDesktop ? 280 : 260

  const isActive = (path) => location.pathname === path

  const logout = () => {
    localStorage.removeItem("session")
    navigate("/login")
  }

  return (
    <div style={styles.container}>

      {/* TOPBAR */}
      <div
        style={{
          ...styles.topbar,
          left: esDesktop ? sidebarRealWidth : 0,
          width: esDesktop ? `calc(100% - ${sidebarRealWidth}px)` : "100%",
          padding: esMovil ? "0 12px" : "0 15px",
          boxSizing: "border-box",
        }}
      >
        <button
          onClick={() => setOpen(true)}
          style={{
            ...styles.menuBtn,
            display: esDesktop ? "none" : "block",
          }}
        >
          ☰
        </button>

        <span
          style={{
            ...styles.title,
            marginLeft: esDesktop ? 0 : 10,
            fontSize: esMovil ? 16 : 18,
          }}
        >
          Caja Aula
        </span>
      </div>

      {/* OVERLAY */}
      {open && !esDesktop && (
        <div
          style={styles.overlay}
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        style={{
          ...styles.sidebar,
          top: esDesktop ? 0 : 55,
          left: esDesktop ? 0 : open ? "0" : `-${sidebarWidth}px`,
          width: esDesktop ? 240 : 220,
          height: esDesktop ? "100vh" : "calc(100vh - 55px)",
          padding: esMovil ? 18 : 20,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            ...styles.logo,
            fontSize: esMovil ? 17 : 18,
          }}
        >
          💰 Caja Aula
        </div>

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

            <Link onClick={() => setOpen(false)} to="/tesoreria"
              style={isActive("/tesoreria") ? styles.active : styles.link}>
              💰 Tesorería
            </Link>

            <Link onClick={() => setOpen(false)} to="/tesoreriamultas"
              style={isActive("/tesoreriamultas") ? styles.active : styles.link}>
              💰 Tesorería multas
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
      <main
        style={{
          ...styles.main,
          marginTop: 55,
          marginLeft: esDesktop ? sidebarRealWidth : 0,
          padding: esMovil ? 12 : esTablet ? 16 : 20,
          boxSizing: "border-box",
          width: esDesktop ? `calc(100% - ${sidebarRealWidth}px)` : "100%",
          overflowX: "hidden",
        }}
      >
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
    overflowX: "hidden",
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
    boxSizing: "border-box",
  },

  menuBtn: {
    fontSize: 22,
    background: "none",
    border: "none",
    color: "white",
    cursor: "pointer",
  },

  title: {
    fontWeight: "bold",
    marginLeft: 10,
  },

  overlay: {
    position: "fixed",
    top: 55,
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
    boxSizing: "border-box",
  },

  logo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 25,
    whiteSpace: "nowrap",
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
    display: "block",
    wordBreak: "break-word",
  },

  active: {
    background: "#2563eb",
    color: "white",
    padding: 10,
    borderRadius: 8,
    textDecoration: "none",
    display: "block",
    wordBreak: "break-word",
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
    cursor: "pointer",
  },

  main: {
    marginTop: 55,
    padding: 20,
  },
}