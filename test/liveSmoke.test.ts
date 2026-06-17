import { describe, expect, it } from "vitest";
import { hasViamConfig, readViamConfig } from "../src/config.js";
import { createLiveViamClient } from "../src/viam/liveClient.js";

const describeIfLiveConfig = hasViamConfig() ? describe : describe.skip;

describeIfLiveConfig("live Viam smoke", () => {
  it("runs bounded read-only live checks", async () => {
    const config = readViamConfig();
    const client = await createLiveViamClient(config);

    const identity = await client.whoami();
    const machines = await client.listMachines();
    const errors = await client.getRecentErrors({ limit: 1 });

    expect(identity).toMatchObject({
      authenticated: true,
      mode: "live",
      org: {
        id: config.orgId
      }
    });
    expect(Array.isArray(machines)).toBe(true);
    expect(Array.isArray(errors)).toBe(true);
    expect(errors.length).toBeLessThanOrEqual(1);
    expect(errors.every((entry) => entry.trustedAsInstruction === false)).toBe(true);
  }, 30_000);
});
