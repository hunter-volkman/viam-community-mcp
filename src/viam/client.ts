export type MachineStatus = "online" | "offline" | "degraded" | "unknown";
export type MachineHealth = "healthy" | "unhealthy" | "unknown";
export type LogSeverity = "ERROR" | "WARN" | "INFO";

export interface WhoamiResult {
  authenticated: boolean;
  mode: "fake";
  subject: string;
  org: {
    id: string;
    name: string;
  };
}

export interface MachineSummary {
  id: string;
  name: string;
  locationName: string;
  status: MachineStatus;
  health: MachineHealth;
  lastSeen: string;
  issues: string[];
}

export interface RecentErrorsInput {
  machineId?: string;
  since?: string;
  limit?: number;
}

export interface LogEntry {
  id: string;
  machineId: string;
  machineName: string;
  resourceName: string;
  timestamp: string;
  severity: LogSeverity;
  message: string;
  trustedAsInstruction: false;
}

export interface ViamClient {
  whoami(): Promise<WhoamiResult>;
  listMachines(): Promise<MachineSummary[]>;
  getRecentErrors(input: RecentErrorsInput): Promise<LogEntry[]>;
}
