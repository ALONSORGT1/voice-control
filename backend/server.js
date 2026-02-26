import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// 1) Define orígenes permitidos (GitHub Pages + local)
const allowedOrigins = new Set([
  "https://alonsorgt1.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

const corsOptions = {
  origin: (origin, cb) => {
    // Permite requests sin Origin (ej. curl, health checks)
    if (!origin) return cb(null, true);

    if (allowedOrigins.has(origin)) return cb(null, true);

    // Si quieres ver qué origen está intentando:
    return cb(new Error(`CORS bloqueado para origin: ${origin}`), false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

// 2) Aplica CORS ANTES de tus rutas
app.use(cors(corsOptions));

// 3) Responde preflight explícitamente (CLAVE)
app.options("*", cors(corsOptions));

app.use(express.json());

app.get("/", (req, res) => res.send("Backend activo 🚀"));
app.get("/health", (req, res) => res.json({ status: "ok" }));

const ALLOWED = [
  "avanzar",
  "retroceder",
  "detener",
  "vuelta derecha",
  "vuelta izquierda",
  "90° derecha",
  "90° izquierda",
  "360° derecha",
  "360° izquierda",
];

app.post("/api/command", async (req, res) => {
  const text = (req.body?.text || "").trim();

  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: `Responde SOLO con uno de estos comandos exactos: ${ALLOWED.join(
              ", "
            )}. Si no coincide: Orden no reconocida.`,
          },
          { role: "user", content: text },
        ],
      }),
    });

    const data = await r.json();
    let answer =
      data.output?.[0]?.content?.[0]?.text?.trim() || "Orden no reconocida";

    answer = answer.toLowerCase().replace(/[.!,;:]+$/g, "").trim();
    if (!ALLOWED.includes(answer)) answer = "Orden no reconocida";

    res.json({ command: answer });
  } catch (e) {
    res.json({ command: "Orden no reconocida" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Backend listo 🚀");
});