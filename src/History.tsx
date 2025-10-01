
function History() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Historial de Consultas</h1>
      {history.length === 0 ? (
        <p>No hay registros.</p>
      ) : (
        <ul>
          {history.map((item: any, idx: number) => (
            <li key={idx}>
              Predicción: {item.prediction}, Precisión: {item.accuracy}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default History;