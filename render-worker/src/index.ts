import * as express from "express";
import * as cors from "cors";
import { processRenderJob } from "./process-job";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/render", (req, res) => {
  const payload = req.body;
  if (!payload.renderJobId || !payload.userId || !payload.videoUrl) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  processRenderJob(payload).catch(err => console.error("Process error:", err));
  res.status(202).json({ message: "Render started", renderJobId: payload.renderJobId });
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Worker listening on port ${port}`));
