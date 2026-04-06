import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import axios from "axios";
import { bucket } from "./firebase";

export async function downloadRemoteFileToTemp(url: string, prefix: string): Promise<string> {
  const tempPath = path.join(os.tmpdir(), `${prefix}_${Date.now()}_${path.basename(new URL(url).pathname)}`);
  const writer = fs.createWriteStream(tempPath);
  const response = await axios({ url, method: "GET", responseType: "stream" });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(tempPath));
    writer.on("error", reject);
  });
}

export async function uploadRenderedFile(localPath: string, destination: string): Promise<string> {
  await bucket.upload(localPath, {
    destination,
    metadata: { cacheControl: "public, max-age=31536000" },
  });
  return destination;
}

export async function createSignedReadUrl(fileName: string): Promise<string> {
  const [url] = await bucket.file(fileName).getSignedUrl({
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  return url;
}
