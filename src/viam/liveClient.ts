import {
  appApi,
  commonApi,
  createViamClient,
  type AppClient as SdkAppClient
} from "@viamrobotics/sdk";
import type { ViamConfig } from "../config.js";
import { redactSensitiveText, ViamMcpError } from "../errors.js";
import type {
  LogEntry,
  LogSeverity,
  MachineHealth,
  MachineStatus,
  MachineSummary,
  RecentErrorsInput,
  ViamClient,
  WhoamiResult
} from "./client.js";

export type LiveAppClient = Pick<SdkAppClient, "getOrganization" | "listMachineSummaries" | "getRobotPartLogs">;

interface TimestampLike {
  toDate(): Date;
}

const MACHINE_SUMMARY_LIMIT = 100;
const PART_LOG_SCAN_LIMIT = 50;
const LOG_MESSAGE_LIMIT = 500;

export async function createLiveViamClient(config: ViamConfig): Promise<LiveViamClient> {
  const sdkClient = await createViamClient({
    credentials: {
      type: "api-key",
      authEntity: config.apiKeyId,
      payload: config.apiKey
    }
  });

  return new LiveViamClient({
    orgId: config.orgId,
    appClient: sdkClient.appClient
  });
}

export class LiveViamClient implements ViamClient {
  private readonly orgId: string;
  private readonly appClient: LiveAppClient;

  constructor(options: { orgId: string; appClient: LiveAppClient }) {
    this.orgId = options.orgId;
    this.appClient = options.appClient;
  }

  async whoami(): Promise<WhoamiResult> {
    return this.withLiveErrors(async () => {
      const org = await this.appClient.getOrganization(this.orgId);

      if (org === undefined) {
        throw new ViamMcpError("live_viam_error", "Configured Viam organization was not found.");
      }

      return {
        authenticated: true,
        mode: "live",
        subject: "configured-api-key",
        org: {
          id: org.id,
          name: org.name
        }
      };
    }, "Viam organization lookup");
  }

  async listMachines(): Promise<MachineSummary[]> {
    return this.withLiveErrors(async () => {
      const locations = await this.listLiveMachineSummaries();
      return flattenMachineSummaries(locations);
    }, "Viam machine summary lookup");
  }

  async getRecentErrors(input: RecentErrorsInput): Promise<LogEntry[]> {
    return this.withLiveErrors(async () => {
      const locations = await this.listLiveMachineSummaries();
      const machines = flattenMachineSummaries(locations);
      const summaries = flattenSdkMachineSummaries(locations).filter(
        ({ machine }) => input.machineId === undefined || machine.machineId === input.machineId
      );
      const sinceDate = input.since === undefined ? undefined : new Date(input.since);
      const logLimit = normalizeLogLimit(input.limit);
      const logs: LogEntry[] = [];
      let scannedParts = 0;
      let logSequence = 0;

      for (const summary of summaries) {
        const machine = machines.find((candidate) => candidate.id === summary.machine.machineId);

        if (machine === undefined) {
          continue;
        }

        for (const part of summary.machine.partSummaries) {
          if (part.partId.length === 0 || scannedParts >= PART_LOG_SCAN_LIMIT) {
            continue;
          }

          scannedParts += 1;
          const response = await this.appClient.getRobotPartLogs(part.partId, undefined, ["ERROR"], sinceDate);
          const responseLogs = response.logs as commonApi.LogEntry[];

          logs.push(
            ...responseLogs
              .filter((log: commonApi.LogEntry) => normalizeSeverity(log.level) === "ERROR")
              .map((log: commonApi.LogEntry) => toLogEntry(log, machine, part, logSequence++))
          );
        }
      }

      return logs.filter((log) => withinSinceFilter(log, input.since)).sort(compareLogsNewestFirst).slice(0, logLimit);
    }, "Viam recent error lookup");
  }

  private async listLiveMachineSummaries(): Promise<appApi.LocationSummary[]> {
    return this.appClient.listMachineSummaries(this.orgId, undefined, undefined, MACHINE_SUMMARY_LIMIT);
  }

  private async withLiveErrors<T>(operation: () => Promise<T>, action: string): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ViamMcpError) {
        throw error;
      }

      throw new ViamMcpError("live_viam_error", `${action} failed: ${safeErrorMessage(error)}`);
    }
  }
}

function flattenMachineSummaries(locations: appApi.LocationSummary[]): MachineSummary[] {
  return flattenSdkMachineSummaries(locations).map(({ location, machine }) => toMachineSummary(location, machine));
}

function flattenSdkMachineSummaries(
  locations: appApi.LocationSummary[]
): Array<{ location: appApi.LocationSummary; machine: appApi.MachineSummary }> {
  return locations.flatMap((location) =>
    (location.machineSummaries as appApi.MachineSummary[]).map((machine: appApi.MachineSummary) => ({
      location,
      machine
    }))
  );
}

function toMachineSummary(location: appApi.LocationSummary, machine: appApi.MachineSummary): MachineSummary {
  const status = machineStatus(machine.partSummaries);

  return {
    id: machine.machineId,
    name: machine.machineName,
    locationName: location.locationName,
    status,
    health: machineHealth(status),
    lastSeen: latestPartTimestamp(machine.partSummaries) ?? "unknown",
    issues: machineIssues(machine.partSummaries)
  };
}

function machineStatus(parts: appApi.PartSummary[]): MachineStatus {
  if (parts.length === 0) {
    return "unknown";
  }

  const states = parts.map((part) => part.onlineState);
  const onlineCount = states.filter((state) => state === appApi.OnlineState.ONLINE).length;
  const offlineCount = states.filter((state) => state === appApi.OnlineState.OFFLINE).length;

  if (onlineCount === parts.length) {
    return "online";
  }

  if (offlineCount === parts.length) {
    return "offline";
  }

  if (onlineCount > 0 || offlineCount > 0) {
    return "degraded";
  }

  return "unknown";
}

function machineHealth(status: MachineStatus): MachineHealth {
  if (status === "online") {
    return "healthy";
  }

  if (status === "offline" || status === "degraded") {
    return "unhealthy";
  }

  return "unknown";
}

function machineIssues(parts: appApi.PartSummary[]): string[] {
  if (parts.length === 0) {
    return ["No machine parts were returned by the Viam API."];
  }

  const issues: string[] = [];
  const offlineParts = parts.filter((part) => part.onlineState === appApi.OnlineState.OFFLINE);
  const awaitingSetupParts = parts.filter((part) => part.onlineState === appApi.OnlineState.AWAITING_SETUP);

  if (offlineParts.length > 0) {
    issues.push(`${offlineParts.length} part(s) offline: ${offlineParts.slice(0, 5).map(partLabel).join(", ")}.`);
  }

  if (awaitingSetupParts.length > 0) {
    issues.push(
      `${awaitingSetupParts.length} part(s) awaiting setup: ${awaitingSetupParts.slice(0, 5).map(partLabel).join(", ")}.`
    );
  }

  if (machineStatus(parts) === "degraded") {
    issues.push("Machine has mixed part online states.");
  }

  return issues;
}

function latestPartTimestamp(parts: appApi.PartSummary[]): string | undefined {
  const timestamps = parts
    .flatMap((part) => [timestampToIso(part.lastAccess), timestampToIso(part.lastOnline)])
    .filter((value): value is string => value !== undefined)
    .sort((left, right) => Date.parse(right) - Date.parse(left));

  return timestamps[0];
}

function toLogEntry(
  log: commonApi.LogEntry,
  machine: MachineSummary,
  part: appApi.PartSummary,
  index: number
): LogEntry {
  const timestamp = timestampToIso(log.time) ?? "unknown";

  return {
    id: `live-log-${machine.id}-${timestamp}-${index}`,
    machineId: machine.id,
    machineName: machine.name,
    resourceName: log.loggerName.length > 0 ? log.loggerName : partLabel(part),
    timestamp,
    severity: normalizeSeverity(log.level),
    message: truncate(redactSensitiveText(log.message), LOG_MESSAGE_LIMIT),
    trustedAsInstruction: false
  };
}

function compareLogsNewestFirst(left: LogEntry, right: LogEntry): number {
  return parseTimestamp(right.timestamp) - parseTimestamp(left.timestamp);
}

function normalizeSeverity(level: string): LogSeverity {
  if (level === "ERROR" || level === "WARN") {
    return level;
  }

  return "INFO";
}

function timestampToIso(timestamp: TimestampLike | undefined): string | undefined {
  if (timestamp === undefined) {
    return undefined;
  }

  const date = timestamp.toDate();
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function parseTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function partLabel(part: appApi.PartSummary): string {
  if (part.partName.length > 0) {
    return part.partName;
  }

  if (part.partId.length > 0) {
    return part.partId;
  }

  return "unknown part";
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return redactSensitiveText(error.message);
  }

  if (typeof error === "string") {
    return redactSensitiveText(error);
  }

  return "Unexpected live Viam error.";
}

function normalizeLogLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return 20;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 50);
}

function withinSinceFilter(log: LogEntry, since: string | undefined): boolean {
  if (since === undefined) {
    return true;
  }

  return parseTimestamp(log.timestamp) >= Date.parse(since);
}
