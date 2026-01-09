import crypto from "crypto";

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type TelegramInitData = {
  auth_date: string;
  hash: string;
  user?: TelegramUser;
  [key: string]: string | TelegramUser | undefined;
};

export function parseInitData(initData: string): TelegramInitData | null {
  const params = new URLSearchParams(initData);
  const data: TelegramInitData = { auth_date: "", hash: "" };

  for (const [key, value] of params.entries()) {
    if (key === "user") {
      try {
        data.user = JSON.parse(value) as TelegramUser;
      } catch {
        return null;
      }
    } else {
      data[key] = value;
    }
  }

  if (!data.hash || !data.auth_date) {
    return null;
  }

  return data;
}

export function verifyInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    return false;
  }

  const sorted = Array.from(params.entries())
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHash("sha256")
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(sorted)
    .digest("hex");

  return computedHash === hash;
}

export function getTelegramUser(initData: string, botToken: string) {
  if (!verifyInitData(initData, botToken)) {
    return null;
  }
  const parsed = parseInitData(initData);
  return parsed?.user ?? null;
}
