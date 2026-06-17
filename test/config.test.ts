import { describe, expect, it } from "vitest";
import { hasViamConfig, readViamConfig } from "../src/config.js";
import { toSafeToolError } from "../src/errors.js";

describe("Viam config", () => {
  it("reads and trims required live Viam env vars", () => {
    const config = readViamConfig({
      VIAM_API_KEY_ID: " key-id ",
      VIAM_API_KEY: " secret-key ",
      VIAM_ORG_ID: " org-id "
    });

    expect(config).toEqual({
      apiKeyId: "key-id",
      apiKey: "secret-key",
      orgId: "org-id"
    });
    expect(hasViamConfig({ VIAM_API_KEY_ID: "key-id", VIAM_API_KEY: "secret-key", VIAM_ORG_ID: "org-id" })).toBe(
      true
    );
  });

  it("rejects missing or empty live Viam env vars without exposing values", () => {
    let caught: unknown;

    try {
      readViamConfig({ VIAM_API_KEY_ID: "key-id", VIAM_API_KEY: "   " });
    } catch (error) {
      caught = error;
    }

    const error = toSafeToolError(caught);

    expect(error).toEqual({
      code: "missing_config",
      message: "VIAM_API_KEY, VIAM_ORG_ID are required.",
      retryable: false
    });
    expect(error.message).not.toContain("key-id");
    expect(hasViamConfig({ VIAM_API_KEY_ID: "key-id", VIAM_API_KEY: "   ", VIAM_ORG_ID: "org-id" })).toBe(false);
  });
});
