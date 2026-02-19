import express from "express";
import cors from "cors";
import dotenv from "dotenv";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend activo 🚀");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const ALLOWED = [
  "avanzar",
  "retroceder",
  "detener",
  "vuelta derecha",
  "vuelta izquierda",
  "90° derecha",
  "90° izquierda",
  "360° derecha",
  "360° izquierda"
];

app.post("/api/command", async (req, res) => {
  const text = (req.body?.text || "").trim();

  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: `Responde SOLO con uno de estos comandos exactos: ${ALLOWED.join(", ")}. Si no coincide: Orden no reconocida.` },
          { role: "user", content: text }
        ]
      })
    });

    const data = await r.json();
    let answer = data.output?.[0]?.content?.[0]?.text?.trim() || "Orden no reconocida";
    answer = answer.toLowerCase().replace(/[.!,;:]+$/g, "").trim();

    if (!ALLOWED.includes(answer)) answer = "Orden no reconocida";
    res.json({ command: answer });
  } catch {
    res.json({ command: "Orden no reconocida" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Backend listo en http://localhost:3000");
});
