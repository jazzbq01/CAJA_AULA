import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import ProtectedRoute from "./components/ProtectedRoute"

import Layout from "./layout/Layout.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Alumnos from "./pages/Alumnos.jsx"
import AlumnoDetalle from "./pages/AlumnoDetalle.jsx"
import Reportes from "./pages/Reportes.jsx"
import Actividades from "./pages/Actividades"
import Login from "./pages/Login.jsx"
import TesoreriaActividades from "./pages/TesoreriaActividades"
import TesoreriaDetalle from "./pages/TesoreriaDetalle"

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) return <div>Cargando...</div>

  return (
    <BrowserRouter>

      <Routes>

        {/* 🔓 LOGIN PUBLICO */}
        <Route path="/login" element={<Login />} />

        {/* 🔐 RUTAS PROTEGIDAS */}
        <Route
          path="/"
          element={
            <ProtectedRoute user={session}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alumnos"
          element={
            <ProtectedRoute user={session}>
              <Layout>
                <Alumnos />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alumnos/:id"
          element={
            <ProtectedRoute user={session}>
              <Layout>
                <AlumnoDetalle />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/actividades"
          element={
            <ProtectedRoute user={session}>
              <Layout>
                <Actividades />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reportes"
          element={
            <ProtectedRoute user={session}>
              <Layout>
                <Reportes />
              </Layout>
            </ProtectedRoute>
          }
        />

               <Route
          path="/tesoreria"
          element={
            <ProtectedRoute user={session}>
              <Layout>
                <TesoreriaActividades />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tesoreria/:id"
          element={
            <ProtectedRoute user={session}>
              <Layout>
                <TesoreriaDetalle />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* fallback */}
        <Route
          path="*"
          element={<Navigate to={session ? "/" : "/login"} />}
        />

      </Routes>

    </BrowserRouter>
  )
}