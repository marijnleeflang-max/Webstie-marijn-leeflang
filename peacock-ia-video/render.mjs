// Rendert index.html frame-voor-frame naar peacock-ia-promo.mp4
// Gebruik: node render.mjs [fps]   (vereist playwright + ffmpeg in PATH of FFMPEG env)
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const fps = Number(process.argv[2] || 30);
const ffmpeg = process.env.FFMPEG || "ffmpeg";
const out = path.join(dir, "peacock-ia-promo.mp4");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(path.join(dir, "index.html")).href + "?render=1");
const duration = await page.evaluate(() => window.DURATION);
const frames = Math.round(duration * fps);

const enc = spawn(ffmpeg, [
  "-y", "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
  "-movflags", "+faststart", out,
], { stdio: ["pipe", "inherit", "inherit"] });

for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.renderAt(t), i / fps);
  const buf = await page.screenshot({ type: "png" });
  if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once("drain", r));
  if (i % fps === 0) process.stdout.write(`\rframe ${i}/${frames}`);
}
enc.stdin.end();
await new Promise((r) => enc.on("close", r));
await browser.close();
console.log(`\nKlaar: ${out}`);
