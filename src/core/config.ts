import dotenv from "dotenv";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promises as fsp } from "node:fs";
import { z } from "zod";

export type Config = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

const apiKeySchema = z.string().min(1, "Z_AI_API_KEY is required");
const globalConfigPath = path.join(os.homedir(), ".zai", "config.json");

export const loadConfig = (): Config => {
  const envKey = readKey(process.env.Z_AI_API_KEY);
  if (envKey) {
    return {
      apiKey: envKey,
      baseUrl: "https://api.z.ai/api/coding/paas/v4",
      model: "glm-4.7"
    };
  }

  dotenv.config({ path: path.join(process.cwd(), ".env"), override: true });
  const dotEnvKey = readKey(process.env.Z_AI_API_KEY);
  if (dotEnvKey) {
    return {
      apiKey: dotEnvKey,
      baseUrl: "https://api.z.ai/api/coding/paas/v4",
      model: "glm-4.7"
    };
  }

  const globalKey = loadGlobalKey();
  if (globalKey) {
    return {
      apiKey: globalKey,
      baseUrl: "https://api.z.ai/api/coding/paas/v4",
      model: "glm-4.7"
    };
  }

  throw new Error(
    "No API Key found. Please run `my-agent config --set-key <KEY>` or add it to your environment."
  );
};

export const saveGlobalConfig = async (apiKey: string) => {
  const key = apiKeySchema.parse(apiKey);
  const dir = path.dirname(globalConfigPath);
  await fsp.mkdir(dir, { recursive: true });
  const payload = JSON.stringify({ Z_AI_API_KEY: key }, null, 2);
  await fsp.writeFile(globalConfigPath, payload, "utf8");
};

const readKey = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  try {
    return apiKeySchema.parse(value);
  } catch {
    return "";
  }
};

const loadGlobalKey = () => {
  if (!fs.existsSync(globalConfigPath)) {
    return "";
  }
  try {
    const raw = fs.readFileSync(globalConfigPath, "utf8");
    const parsed = JSON.parse(raw) as { Z_AI_API_KEY?: unknown; apiKey?: unknown };
    const key = parsed.Z_AI_API_KEY ?? parsed.apiKey;
    return readKey(key);
  } catch {
    return "";
  }
};
