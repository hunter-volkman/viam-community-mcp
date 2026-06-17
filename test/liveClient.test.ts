import { appApi, commonApi, Timestamp } from "@viamrobotics/sdk";
import { describe, expect, it } from "vitest";
import { LiveViamClient, type LiveAppClient } from "../src/viam/liveClient.js";

describe("LiveViamClient", () => {
  it("reports live org identity without exposing credential identity", async () => {
    const client = new LiveViamClient({
      orgId: "org-live-001",
      appClient: fakeAppClient({
        org: new appApi.Organization({ id: "org-live-001", name: "Live Org" }),
        locations: []
      })
    });

    await expect(client.whoami()).resolves.toEqual({
      authenticated: true,
      mode: "live",
      subject: "configured-api-key",
      org: {
        id: "org-live-001",
        name: "Live Org"
      }
    });
  });

  it("maps SDK machine summaries to bounded machine output", async () => {
    const client = new LiveViamClient({
      orgId: "org-live-001",
      appClient: fakeAppClient({
        locations: [
          new appApi.LocationSummary({
            locationId: "private-location-id",
            locationName: "test-lab",
            machineSummaries: [
              machine("machine-online", "online-machine", [
                part("part-online", "main", appApi.OnlineState.ONLINE, "2026-06-17T14:10:00.000Z")
              ]),
              machine("machine-offline", "offline-machine", [
                part("part-offline", "main", appApi.OnlineState.OFFLINE, "2026-06-17T13:10:00.000Z")
              ]),
              machine("machine-degraded", "degraded-machine", [
                part("part-up", "primary", appApi.OnlineState.ONLINE, "2026-06-17T14:08:00.000Z"),
                part("part-down", "camera", appApi.OnlineState.OFFLINE, "2026-06-17T13:58:00.000Z")
              ]),
              machine("machine-unknown", "unknown-machine", [
                part("part-awaiting", "setup", appApi.OnlineState.AWAITING_SETUP)
              ])
            ]
          })
        ]
      })
    });

    const result = await client.listMachines();

    expect(result).toEqual([
      expect.objectContaining({
        id: "machine-online",
        locationName: "test-lab",
        status: "online",
        health: "healthy",
        lastSeen: "2026-06-17T14:10:00.000Z",
        issues: []
      }),
      expect.objectContaining({
        id: "machine-offline",
        status: "offline",
        health: "unhealthy",
        issues: ["1 part(s) offline: main."]
      }),
      expect.objectContaining({
        id: "machine-degraded",
        status: "degraded",
        health: "unhealthy",
        issues: ["1 part(s) offline: camera.", "Machine has mixed part online states."]
      }),
      expect.objectContaining({
        id: "machine-unknown",
        status: "unknown",
        health: "unknown",
        lastSeen: "unknown",
        issues: ["1 part(s) awaiting setup: setup."]
      })
    ]);
    expect(JSON.stringify(result)).not.toContain("private-location-id");
    expect(JSON.stringify(result)).not.toContain("192.0.2.10");
    expect(JSON.stringify(result)).not.toContain("online-machine.example");
    expect(JSON.stringify(result)).not.toContain("private-fragment");
  });

  it("uses bounded read-only part log calls and returns safe recent errors", async () => {
    const logCalls: LogCall[] = [];
    const client = new LiveViamClient({
      orgId: "org-live-001",
      appClient: fakeAppClient({
        locations: [
          new appApi.LocationSummary({
            locationName: "test-lab",
            machineSummaries: [
              machine("machine-logs", "logs-machine", [
                part("part-logs", "main", appApi.OnlineState.ONLINE, "2026-06-17T14:10:00.000Z")
              ])
            ]
          })
        ],
        getRobotPartLogs: async (id, filter, levels, start, end, pageToken) => {
          logCalls.push({ id, filter, levels, start, end, pageToken });
          return new appApi.GetRobotPartLogsResponse({
            logs: [
              log("ERROR", "2026-06-17T13:00:00.000Z", "rdk:service:module-runner", "old error"),
              log(
                "ERROR",
                "2026-06-17T14:05:00.000Z",
                "rdk:service:module-runner",
                `VIAM_API_KEY=secret-value ${"x".repeat(600)}`
              ),
              log("WARN", "2026-06-17T14:06:00.000Z", "rdk:service:module-runner", "warn only")
            ]
          });
        }
      })
    });

    const result = await client.getRecentErrors({ since: "2026-06-17T14:00:00.000Z", limit: 1 });

    expect(logCalls).toEqual([
      {
        id: "part-logs",
        filter: undefined,
        levels: ["ERROR"],
        start: new Date("2026-06-17T14:00:00.000Z"),
        end: undefined,
        pageToken: undefined
      }
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      machineId: "machine-logs",
      machineName: "logs-machine",
      resourceName: "rdk:service:module-runner",
      timestamp: "2026-06-17T14:05:00.000Z",
      severity: "ERROR",
      trustedAsInstruction: false
    });
    expect(result[0]?.message).toContain("VIAM_API_KEY=[redacted]");
    expect(result[0]?.message).not.toContain("secret-value");
    expect(result[0]?.message.length).toBeLessThanOrEqual(500);
    expect(JSON.stringify(result)).not.toContain("host-private");
    expect(JSON.stringify(result)).not.toContain("stack-private");
  });

  it("redacts live SDK errors before exposing them", async () => {
    const client = new LiveViamClient({
      orgId: "org-live-001",
      appClient: {
        async getOrganization() {
          throw new Error("payload=super-secret authEntity=key-id Authorization: Bearer abcdef123456");
        },
        async listMachineSummaries() {
          return [];
        },
        async getRobotPartLogs() {
          return new appApi.GetRobotPartLogsResponse();
        }
      }
    });

    await expect(client.whoami()).rejects.toMatchObject({
      code: "live_viam_error",
      message:
        "Viam organization lookup failed: payload=[redacted] authEntity=[redacted] Authorization: Bearer [redacted]"
    });
  });
});

interface LogCall {
  id: string;
  filter?: string;
  levels?: string[];
  start?: Date;
  end?: Date;
  pageToken?: string;
}

function fakeAppClient(options: {
  org?: appApi.Organization;
  locations?: appApi.LocationSummary[];
  getRobotPartLogs?: LiveAppClient["getRobotPartLogs"];
}): LiveAppClient {
  return {
    async getOrganization() {
      return options.org ?? new appApi.Organization({ id: "org-live-001", name: "Live Org" });
    },
    async listMachineSummaries() {
      return options.locations ?? [];
    },
    async getRobotPartLogs(id, filter, levels, start, end, pageToken) {
      if (options.getRobotPartLogs !== undefined) {
        return options.getRobotPartLogs(id, filter, levels, start, end, pageToken);
      }

      return new appApi.GetRobotPartLogsResponse();
    }
  };
}

function machine(id: string, name: string, partSummaries: appApi.PartSummary[]): appApi.MachineSummary {
  return new appApi.MachineSummary({
    machineId: id,
    machineName: name,
    partSummaries
  });
}

function part(
  id: string,
  name: string,
  onlineState: appApi.OnlineState,
  lastSeen?: string
): appApi.PartSummary {
  return new appApi.PartSummary({
    partId: id,
    partName: name,
    isMainPart: name === "main",
    onlineState,
    lastAccess: lastSeen === undefined ? undefined : Timestamp.fromDate(new Date(lastSeen)),
    publicIpAddress: "192.0.2.10",
    dnsName: "online-machine.example",
    fragments: ["private-fragment"]
  });
}

function log(level: string, timestamp: string, loggerName: string, message: string): commonApi.LogEntry {
  return new commonApi.LogEntry({
    host: "host-private",
    level,
    time: Timestamp.fromDate(new Date(timestamp)),
    loggerName,
    message,
    stack: "stack-private"
  });
}
