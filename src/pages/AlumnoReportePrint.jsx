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
        <div className="alumno-info">
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
      <div className="tabla-wrapper">
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
      </div>

      {/* PRINT STYLE PRO */}
      <style>{`
        .print-container{
          font-family: Arial;
          padding: 20px;
          background: white;
          color: #111;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .header{
          margin-bottom: 10px;
        }

        .title{
          font-size: 22px;
          font-weight: bold;
          line-height: 1.2;
          word-break: break-word;
        }

        .subtitle{
          font-size: 12px;
          color: #6b7280;
          line-height: 1.4;
        }

        .alumno{
          display: flex;
          gap: 10px;
          align-items: center;
          margin: 10px 0;
        }

        .alumno-info{
          min-width: 0;
        }

        .alumno-info h3{
          margin: 0;
          word-break: break-word;
          line-height: 1.2;
        }

        .alumno-info small{
          display: block;
          margin-top: 3px;
          color: #6b7280;
          line-height: 1.3;
        }

        .avatar{
          width: 40px;
          height: 40px;
          min-width: 40px;
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
          box-sizing: border-box;
          line-height: 1.3;
          word-break: break-word;
        }

        .card div{
          margin-top: 5px;
          font-size: 16px;
        }

        .ingreso{ background:#ecfdf5; border:1px solid #22c55e; }
        .gasto{ background:#fef2f2; border:1px solid #ef4444; }
        .saldo{ background:#eff6ff; border:1px solid #3b82f6; }

        .tabla-wrapper{
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

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
          white-space: nowrap;
        }

        .tabla-reporte td{
          border-bottom:1px solid #e5e7eb;
          padding:6px;
          vertical-align: top;
          word-break: break-word;
        }

        .tabla-reporte td:nth-child(2),
        .tabla-reporte td:nth-child(3),
        .tabla-reporte td:nth-child(4){
          white-space: nowrap;
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

        @media screen and (max-width: 600px) {
          .print-container{
            padding: 12px;
          }

          .title{
            font-size: 20px;
          }

          .subtitle{
            font-size: 11px;
          }

          .alumno{
            align-items: flex-start;
          }

          .avatar{
            width: 36px;
            height: 36px;
            min-width: 36px;
          }

          .alumno-info h3{
            font-size: 17px;
          }

          .resumen{
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .card{
            padding: 10px;
            font-size: 14px;
          }

          .card div{
            font-size: 16px;
          }

          h4{
            font-size: 16px;
            margin: 12px 0 8px;
          }

          .tabla-reporte{
            min-width: 620px;
            font-size: 11px;
          }

          .tabla-reporte th{
            padding: 7px;
          }

          .tabla-reporte td{
            padding: 6px;
          }

          .btn{
            width: 100%;
            min-height: 42px;
            padding: 11px 14px;
          }
        }

        @media screen and (min-width: 601px) and (max-width: 900px) {
          .print-container{
            padding: 16px;
          }

          .title{
            font-size: 21px;
          }

          .resumen{
            grid-template-columns: repeat(2, 1fr);
          }

          .saldo{
            grid-column: 1 / -1;
          }

          .tabla-reporte{
            font-size: 12px;
          }

          .btn{
            min-height: 42px;
          }
        }

        @media screen and (min-width: 901px) {
          .print-container{
            padding: 20px;
          }
        }

        @media print {
          .no-print { display:none; }

          .btn {
            display:none;
          }

          body {
            background:white;
          }

          .print-container{
            padding: 20px;
            overflow: visible;
          }

          .resumen{
            grid-template-columns: repeat(3, 1fr);
          }

          .tabla-wrapper{
            overflow: visible;
          }

          .tabla-reporte{
            width: 100%;
            min-width: 0;
            font-size: 12px;
          }

          .tabla-reporte th,
          .tabla-reporte td{
            page-break-inside: avoid;
          }
        }
      `}</style>

    </div>
  )
}