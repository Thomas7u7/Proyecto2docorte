import React, { useState } from "react";

interface ImageRecognitionResponse {
  process_time: string;
  prediction: number;
  accuracy: number;
}

/** Detecta si el fondo es claro u oscuro (muestra esquinas) y decide "invert" */
function guessInvertFromCorners(ctx: CanvasRenderingContext2D): "true" | "false" {
  const pts = [
    ctx.getImageData(1, 1, 1, 1).data,
    ctx.getImageData(26, 1, 1, 1).data,
    ctx.getImageData(1, 26, 1, 1).data,
    ctx.getImageData(26, 26, 1, 1).data,
  ];
  let sum = 0;
  for (const p of pts) {
    const y = 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]; // luminancia
    sum += y;
  }
  const avg = sum / pts.length;
  // Fondo claro → número oscuro → invert = "false"
  // Fondo oscuro → número claro → invert = "true"
  return avg > 128 ? "false" : "true";
}

/** Reescala manteniendo proporción, centra con margen ~4px y pasa a escala de grises */
async function to28x28(file: File): Promise<{ image: File; canvasForCheck: HTMLCanvasElement }> {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("No se pudo cargar la imagen"));
  });

  // Lienzo final 28x28
  const canvas = document.createElement("canvas");
  canvas.width = 28;
  canvas.height = 28;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no soportado");

  // Fondo blanco por defecto
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 28, 28);

  // Mantener proporción y dejar margen (ajustar dentro de 20x20)
  const target = 20;
  const scale = Math.min(target / img.width, target / img.height);
  const drawW = Math.max(1, Math.round(img.width * scale));
  const drawH = Math.max(1, Math.round(img.height * scale));
  const dx = Math.floor((28 - drawW) / 2);
  const dy = Math.floor((28 - drawH) / 2);

  ctx.imageSmoothingEnabled = true;
  // @ts-ignore
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, dx, dy, drawW, drawH);

  // Escala de grises + contraste
  const imgData = ctx.getImageData(0, 0, 28, 28);
  const d = imgData.data;
  const contrast = 1.25;
  const mid = 128;
  for (let i = 0; i < d.length; i += 4) {
    let y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    y = (y - mid) * contrast + mid;
    y = y < 0 ? 0 : y > 255 ? 255 : y;
    d[i] = d[i + 1] = d[i + 2] = y;
  }
  ctx.putImageData(imgData, 0, 0);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob falló"))), "image/png")
  );

  URL.revokeObjectURL(img.src);
  return { image: new File([blob], "digit.png", { type: "image/png" }), canvasForCheck: canvas };
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [invert, setInvert] = useState<"true" | "false">("false");
  const [autoInvert, setAutoInvert] = useState<boolean>(true);
  const [result, setResult] = useState<ImageRecognitionResponse | null>(null);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError("Por favor, selecciona una imagen.");
      return;
    }
    setError("");
    setResult(null);

    try {
      // 1) Preprocesar
      const { image: processed, canvasForCheck } = await to28x28(file);

      // 2) Calcular invert automáticamente si está activo
      let invertToSend: "true" | "false" = invert;
      if (autoInvert) {
        const ctx = canvasForCheck.getContext("2d");
        if (!ctx) throw new Error("Canvas no soportado");
        invertToSend = guessInvertFromCorners(ctx);
      }

      // 3) Enviar a la API
      const formData = new FormData();
      formData.append("invert", invertToSend);   // "true" o "false"
      formData.append("image", processed);       // PNG 28x28

      const res = await fetch(
        "http://ec2-54-81-142-28.compute-1.amazonaws.com:8080/predict",
        { method: "POST", body: formData }
      );
      if (!res.ok) throw new Error("Error en la petición");

      const data: ImageRecognitionResponse = await res.json();
      setResult(data);

      // Guardar historial
      const history = JSON.parse(localStorage.getItem("history") || "[]");
      history.push({ ...data, invert: invertToSend, ts: Date.now() });
      localStorage.setItem("history", JSON.stringify(history));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "No se pudo procesar la petición.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #4f46e5, #9333ea, #ec4899)",
        color: "#fff",
        padding: 20,
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>
        🔢 Reconocimiento de Dígitos
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 20,
          background: "rgba(255,255,255,0.12)",
          padding: 12,
          borderRadius: 12,
          backdropFilter: "blur(4px)",
        }}
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFile(e.target.files?.[0] || null)
          }
          style={{
            padding: "8px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.9)",
            color: "#111",
          }}
        />

        {/* Selector manual de invert (por si desactivas Auto) */}
        <select
          value={invert}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setInvert(e.target.value as "true" | "false")
          }
          disabled={autoInvert}
          title='false: número negro sobre fondo blanco | true: número blanco sobre fondo negro'
          style={{
            padding: "8px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.4)",
            background: autoInvert ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.9)",
            color: "#111",
          }}
        >
          <option value="false">Negro sobre blanco</option>
          <option value="true">Blanco sobre negro</option>
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={autoInvert}
            onChange={(e) => setAutoInvert(e.target.checked)}
          />
          Auto
        </label>

        <button
          type="submit"
          style={{
            background: "#10b981",
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: 700,
            boxShadow: "0 6px 20px rgba(16,185,129,0.35)",
          }}
        >
          🚀 Enviar
        </button>
      </form>

      {error && (
        <p
          style={{
            color: "#fde68a",
            background: "rgba(0,0,0,0.25)",
            padding: 10,
            borderRadius: 10,
            maxWidth: 560,
          }}
        >
          ⚠ {error}
        </p>
      )}

      {result && (
        <div
          style={{
            background: "rgba(255,255,255,0.12)",
            padding: 16,
            borderRadius: 12,
            marginTop: 16,
            maxWidth: 560,
          }}
        >
          <p><b>Predicción:</b> {result.prediction}</p>
          <p><b>Precisión:</b> {result.accuracy}</p>
          <p><b>Tiempo:</b> {result.process_time}</p>
        </div>
      )}
    </div>
  );
}

export default App;
