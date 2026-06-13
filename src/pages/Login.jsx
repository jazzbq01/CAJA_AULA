import { useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleLogin = async () => {
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert("Error: " + error.message)
      return
    }

    navigate("/")
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h1 style={styles.title}>🔐 Login Comité</h1>
        <p style={styles.subtitle}>Acceso al sistema Caja Aula</p>

        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          style={styles.button}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>

      </div>
    </div>
  )
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
  },

  card: {
    width: 320,
    background: "white",
    padding: 25,
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  title: {
    margin: 0,
    fontSize: 22,
    textAlign: "center",
  },

  subtitle: {
    margin: 0,
    fontSize: 12,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 10,
  },

  input: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #ddd",
    outline: "none",
    fontSize: 14,
  },

  button: {
    padding: 12,
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
}