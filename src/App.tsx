import React, { useState } from "react";

interface ImageRecognitionResponse {
  process_time: string;
  prediction: number;
  accuracy: number;
}

// Función: reescala la imagen a 28x28 px
async function to28x28(file: File): Promise<File> {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej();
  });

  const canvas = document.createElement("canvas");
  canvas.width = 28;
  canvas.height = 28;
  const ctx = canvas.getContext("2d")!;

  // Fondo blanco
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 28, 28);

  // Dibuja la imagen reescalada
  ctx.drawImage(img, 0, 0, 28, 28);

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/png")
  );

  return new File([blob], "digit.png", { type: "image/png" });
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [invert, setInvert] = useState<"true" | "false">("false");
  const [result, setResult] = useState<ImageRecognitionResponse | null>(null);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Por favor, selecciona una imagen.");
      return;
    }
    setError("");

    try {
      // Reescala a 28x28
      const processed = await to28x28(file);

      // FormData con lo que pide el enunciado
      const formData = new FormData();
      formData.append("invert", invert);   // "true" o "false"
      formData.append("image", processed); // Imagen 28x28

      const res = await fetch(
        "http://ec2-54-81-142-28.compute-1.amazonaws.com:8080/predict",
        { method: "POST", body: formData }
      );

      if (!res.ok) throw new Error("Error en la petición");
      const data: ImageRecognitionResponse = await res.json();

      setResult(data);

      // Guardar en historial
      const history = JSON.parse(localStorage.getItem("history") || "[]");
      history.push(data);
      localStorage.setItem("history", JSON.stringify(history));
    } catch {
      setError("No se pudo procesar la petición.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#111", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Reconocimiento de Dígitos</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <select value={invert} onChange={(e) => setInvert(e.target.value as "true" | "false")}>
          <option value="false">Negro sobre blanco</option>
          <option value="true">Blanco sobre negro</option>
        </select>
        <button type="submit">Enviar</button>
      </form>

      {error && <p style={{ color: "#c00", marginTop: 8 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <p><b>Predicción:</b> {result.prediction}</p>
          <p><b>Precisión:</b> {result.accuracy}</p>
          <p><b>Tiempo:</b> {result.process_time}</p>
        </div>
      )}
    </div>
  );
}

export default App;