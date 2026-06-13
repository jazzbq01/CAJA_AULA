export default function AlumnoReportePrint({ alumno, mov, ingresos, gastos }) {
  const saldoFinal = ingresos - gastos

  const descargarPDF = () => {
    window.print() 
    // 👉 esto ya funciona como PDF si el usuario hace "Guardar como PDF"
  }

  return (
    <div className="print-container">

      {/* HEADER BONITO */}
      <div className="header">
        <div className="title">📄 REPORTE DE CUENTA</div>
        <div className="subtitle">Caja Aula - Estado financiero del alumno</div>
      </div>

      <hr />

      {/* INFO ALUMNO */}
      <div className="alumno">
        <div className="avatar">👤</div>
        <div>
          <h3>{alumno?.nombre}</h3>
          <small>Reporte generado automáticamente</small>
        </div>
      </div>

      {/* RESUMEN CARDS */}
      <div className="resumen">

        <div className="card ingreso">
          📈 Ingresos
          <div>S/ {ingresos}</div>
        </div>

        <div className="card gasto">
          📉 Gastos
          <div>S/ {gastos}</div>
        </div>

        <div className="card saldo">
          💰 Saldo final
          <div>S/ {saldoFinal}</div>
        </div>

      </div>

      <hr />

      <h4>📜 Movimientos</h4>

      {/* TABLA */}
      <table className="tabla-reporte">
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Tipo</th>
            <th>Monto</th>
            <th>Fecha</th>
          </tr>
        </thead>

        <tbody>
          {mov.map((m) => (
            <tr key={m.id}>
              <td>{m.concepto}</td>
              <td>
                <span className={m.tipo === "INGRESO" ? "ing" : "gas"}>
                  {m.tipo}
                </span>
              </td>
              <td>S/ {m.monto}</td>
              <td>{new Date(m.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* BOTÓN DESCARGA (solo pantalla) */}
      <div className="no-print">
        <button className="btn" onClick={descargarPDF}>
          📥 Descargar / Imprimir PDF
        </button>
      </div>

      {/* PRINT STYLE PRO */}
      <style>{`
        .print-container{
          font-family: Arial;
          padding: 20px;
          background: white;
          color: #111;
        }

        .header{
          margin-bottom: 10px;
        }

        .title{
          font-size: 22px;
          font-weight: bold;
        }

        .subtitle{
          font-size: 12px;
          color: #6b7280;
        }

        .alumno{
          display: flex;
          gap: 10px;
          align-items: center;
          margin: 10px 0;
        }

        .avatar{
          width: 40px;
          height: 40px;
          background: #e0e7ff;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius: 10px;
        }

        .resumen{
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 15px 0;
        }

        .card{
          padding: 10px;
          border-radius: 10px;
          font-weight: bold;
        }

        .ingreso{ background:#ecfdf5; border:1px solid #22c55e; }
        .gasto{ background:#fef2f2; border:1px solid #ef4444; }
        .saldo{ background:#eff6ff; border:1px solid #3b82f6; }

        .tabla-reporte{
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .tabla-reporte th{
          background:#111827;
          color:white;
          padding:8px;
          text-align:left;
        }

        .tabla-reporte td{
          border-bottom:1px solid #e5e7eb;
          padding:6px;
        }

        .ing{ color:#16a34a; font-weight:bold; }
        .gas{ color:#ef4444; font-weight:bold; }

        .btn{
          margin-top: 15px;
          background:#111827;
          color:white;
          border:none;
          padding:10px 14px;
          border-radius:10px;
          cursor:pointer;
          font-weight:bold;
        }

        @media print {
          .no-print { display:none; }

          .btn {
            display:none;
          }

          body {
            background:white;
          }
        }
      `}</style>

    </div>
  )
}