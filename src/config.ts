import { ViamMcpError } from "./errors.js";

export const VIAM_CONFIG_ENV_VARS = ["VIAM_API_KEY_ID", "VIAM_API_KEY", "VIAM_ORG_ID"] as const;

export interface ViamConfig {
  apiKeyId: string;
  apiKey: string;
  orgId: string;
}

type ViamConfigEnvVar = (typeof VIAM_CONFIG_ENV_VARS)[number];

export function hasViamConfig(env: NodeJS.ProcessEnv = process.env): boolean {
  return VIAM_CONFIG_ENV_VARS.every((name) => envValue(env, name) !== undefined);
}

export function readViamConfig(env: NodeJS.ProcessEnv = process.env): ViamConfig {
  const missing = VIAM_CONFIG_ENV_VARS.filter((name) => envValue(env, name) === undefined);

  if (missing.length > 0) {
    throw new ViamMcpError("missing_config", `${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required.`);
  }

  return {
    apiKeyId: envValue(env, "VIAM_API_KEY_ID") ?? "",
    apiKey: envValue(env, "VIAM_API_KEY") ?? "",
    orgId: envValue(env, "VIAM_ORG_ID") ?? ""
  };
}

function envValue(env: NodeJS.ProcessEnv, name: ViamConfigEnvVar): string | undefined {
  const value = env[name]?.trim();
  return value === undefined || value.length === 0 ? undefined : value;
}
