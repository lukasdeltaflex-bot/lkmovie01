import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import axios from "axios";
import { bucket } from "./firebase";

/**
 * Downloads a file from a URL to a temporary local path.
 */
export async function downloadFile(url: string, prefix: string = "input"): Promise<string> {
  const tempDir = os.tmpdir();
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(url.split("?")[0]) || ""}`;
  const localPath = path.join(tempDir, fileName);

  console.log(`Downloading ${url} to ${localPath}`);

  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream",
  });

  const writer = fs.createWriteStream(localPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(localPath));
    writer.on("error", reject);
  });
}

/**
 * Uploads a local file to Cloud Storage.
 */
export async function uploadFile(localPath: string, destination: string): Promise<string> {
  console.log(`Uploading ${localPath} to ${destination}`);

  await bucket.upload(localPath, {
    destination,
    metadata: {
      cacheControl: "public, max-age=31536000",
    },
  });

  return destination;
}

/**
 * Generates a signed URL for a file in Cloud Storage.
 */
export async function getSignedUrl(filePath: string): Promise<string> {
  const file = bucket.file(filePath);
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });
  return url;
}

/**
 * Ensures temporary directory exists.
 */
export function ensureTempDir() {
  const tempDir = path.join(os.tmpdir(), "lkmovie-render");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * Cleans up temporary files.
 */
export function cleanupFiles(files: string[]) {
  files.forEach((file) => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`Deleted temp file: ${file}`);
      }
    } catch (err) {
      console.error(`Error deleting temp file ${file}:`, err);
    }
  });
}
