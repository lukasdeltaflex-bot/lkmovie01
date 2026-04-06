import * as express from "express";
import { Request, Response } from "express";
import { processRenderJob } from "./process-job";
import { RenderJobPayload } from "./types";

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

/**
 * Health check endpoint.
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).send({ status: "ok", service: "render-worker" });
});

/**
 * Main render job endpoint.
 * This starts the background processing and returns immediately with a 202.
 */
app.post("/render", async (req: Request, res: Response) => {
  const payload = req.body as RenderJobPayload;

  // Basic validation
  if (!payload.renderJobId || !payload.userId || !payload.videoUrl) {
    return res.status(400).send({
      error: "Missing required fields: renderJobId, userId, videoUrl",
    });
  }

  console.log(`Received render request for job ${payload.renderJobId}`);

  // Process job in the background (Async)
  // Express returns 202 Accepted, and Cloud Run continues processing until the job finishes
  processRenderJob(payload)
    .catch((err) => {
      console.error(`Background processing error for job ${payload.renderJobId}:`, err);
    });

  return res.status(202).send({
    message: "Render job received and processing started.",
    jobId: payload.renderJobId,
  });
});

/**
 * Start the server.
 */
app.listen(port, () => {
  console.log(`Render worker listening on port ${port}`);
});
