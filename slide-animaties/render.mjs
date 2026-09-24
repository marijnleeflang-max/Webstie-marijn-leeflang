// Rendert de slide-animaties naar naadloos loopende MP4's (voor PowerPoint).
// Gebruik: node render.mjs [fps] [schaal]    (vereist playwright + ffmpeg; FFMPEG=pad optioneel)
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const fps = Number(process.argv[2] || 30);
const scale = Number(process.argv[3] || 2);
const ffmpeg = process.env.FFMPEG || "ffmpeg";
const outDir = path.join(dir, "video");
fs.mkdirSync(outDir, { recursive: true });

const SLIDES = [
  { file: "slide1-order-verrekening.html", w: 1428, h: 528 },
  { file: "slide2-rpa-ronde.html", w: 1480, h: 528 },
  { file: "slide3-bronnen-dashboard.html", w: 648, h: 444 },
];

const browser = await chromium.launch();
for (const s of SLIDES) {
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: scale });
  await page.goto(pathToFileURL(path.join(dir, s.file)).href + "?render=1");
  await page.waitForFunction(() => window.READY === true);
  const duration = await page.evaluate(() => window.DURATION);
  const frames = Math.round(duration * fps);
  const base = path.join(outDir, s.file.replace(".html", ""));

  const enc = spawn(ffmpeg, [
    "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow",
    "-profile:v", "high", "-movflags", "+faststart", base + ".mp4",
  ], { stdio: ["pipe", "inherit", "inherit"] });

  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.renderAt(t), i / fps);
    const buf = await page.screenshot({ type: "png" });
    if (i === Math.round(frames * 0.3)) fs.writeFileSync(base + "-poster.png", buf);
    if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once("drain", r));
  }
  enc.stdin.end();
  await new Promise((r) => enc.on("close", r));
  console.log(`✓ ${base}.mp4 (${duration}s, ${frames} frames)`);
  await page.close();
}
await browser.close();
