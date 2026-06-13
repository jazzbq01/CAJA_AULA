export default function AlumnoReportePrint({ alumno, mov, ingresos, gastos }) {
  const saldoFinal = ingresos - gastos

  return (
    <div className="print-container">

      <h2>📄 REPORTE DE CUENTA</h2>

      <hr />

      <h3>👤 {alumno?.nombre}</h3>

      <div>
        📈 Ingresos: S/ {ingresos}
      </div>

      <div>
        📉 Gastos: S/ {gastos}
      </div>

      <h3>💰 Saldo final: S/ {saldoFinal}</h3>

      <hr />

      <h4>📜 Movimientos</h4>

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
    {(() => {
      let saldo = 0

      return mov.map((m) => {
        const monto = Number(m.monto)

        if (m.tipo === "INGRESO") saldo += monto
        else saldo -= monto

        return (
          <tr key={m.id}>
            <td>{m.concepto}</td>
            <td>{m.tipo}</td>
            <td>S/ {monto}</td>
            <td>{new Date(m.created_at).toLocaleString()}</td>
          </tr>
        )
      })
    })()}
  </tbody>
</table>

      {/* 🔥 SOLO PRINT */}
      <style>{`
        @media print {
          body {
            background: white;
          }

          body * {
            visibility: hidden;
          }

          .print-container, .print-container * {
            visibility: visible;
          }

          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }

            .tabla-reporte {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  font-family: Arial;
}

.tabla-reporte th {
  background: #111827;
  color: white;
  padding: 8px;
  text-align: left;
}

.tabla-reporte td {
  border-bottom: 1px solid #e5e7eb;
  padding: 6px;
}

.tabla-reporte tr:nth-child(even) {
  background: #f9fafb;
}
        }
      `}</style>

    </div>
  )
}