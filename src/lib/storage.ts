import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");

export function ensureDataFile(fileName: string, fallback: unknown) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
  }
  return filePath;
}

export function readJson<T>(fileName: string, fallback: T): T {
  const filePath = ensureDataFile(fileName, fallback);
  const raw = fs.readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Не удалось прочитать ${fileName}`, error);
    return fallback;
  }
}

export function writeJson<T>(fileName: string, data: T) {
  const filePath = ensureDataFile(fileName, data);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
