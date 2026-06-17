import type {
  LogEntry,
  MachineSummary,
  RecentErrorsInput,
  ViamClient,
  WhoamiResult
} from "./client.js";

export interface FakeViamClientOptions {
  whoami?: WhoamiResult;
  machines?: MachineSummary[];
  logs?: LogEntry[];
}

const DEFAULT_WHOAMI: WhoamiResult = {
  authenticated: true,
  mode: "fake",
  subject: "fake-codex-user",
  org: {
    id: "fake-org-001",
    name: "Example Robotics"
  }
};

const DEFAULT_MACHINES: MachineSummary[] = [
  {
    id: "fake-machine-001",
    name: "greenhouse-pi-01",
    locationName: "test-greenhouse",
    status: "online",
    health: "healthy",
    lastSeen: "2026-06-17T14:05:00.000Z",
    issues: []
  },
  {
    id: "fake-machine-002",
    name: "greenhouse-pi-02",
    locationName: "test-greenhouse",
    status: "offline",
    health: "unhealthy",
    lastSeen: "2026-06-17T13:41:00.000Z",
    issues: ["Machine has not checked in recently."]
  },
  {
    id: "fake-machine-003",
    name: "inspection-rover-01",
    locationName: "test-lab",
    status: "degraded",
    health: "unhealthy",
    lastSeen: "2026-06-17T14:04:00.000Z",
    issues: ["Camera resource is reporting recent errors."]
  }
];

const DEFAULT_LOGS: LogEntry[] = [
  {
    id: "fake-log-001",
    machineId: "fake-machine-002",
    machineName: "greenhouse-pi-02",
    resourceName: "rdk:service:module-runner",
    timestamp: "2026-06-17T14:01:00.000Z",
    severity: "ERROR",
    message: "module exited with status 1",
    trustedAsInstruction: false
  },
  {
    id: "fake-log-002",
    machineId: "fake-machine-003",
    machineName: "inspection-rover-01",
    resourceName: "rdk:component:camera/front",
    timestamp: "2026-06-17T13:58:00.000Z",
    severity: "ERROR",
    message: "camera stream timeout after 30s",
    trustedAsInstruction: false
  },
  {
    id: "fake-log-003",
    machineId: "fake-machine-001",
    machineName: "greenhouse-pi-01",
    resourceName: "rdk:component:sensor/soil",
    timestamp: "2026-06-17T13:50:00.000Z",
    severity: "WARN",
    message: "soil moisture reading delayed",
    trustedAsInstruction: false
  }
];

export class FakeViamClient implements ViamClient {
  private readonly identity: WhoamiResult;
  private readonly machines: MachineSummary[];
  private readonly logs: LogEntry[];

  constructor(options: FakeViamClientOptions = {}) {
    this.identity = options.whoami ?? DEFAULT_WHOAMI;
    this.machines = options.machines ?? DEFAULT_MACHINES;
    this.logs = options.logs ?? DEFAULT_LOGS;
  }

  async whoami(): Promise<WhoamiResult> {
    return {
      ...this.identity,
      org: { ...this.identity.org }
    };
  }

  async listMachines(): Promise<MachineSummary[]> {
    return this.machines.map(cloneMachine);
  }

  async getRecentErrors(input: RecentErrorsInput): Promise<LogEntry[]> {
    const sinceTime = input.since === undefined ? undefined : Date.parse(input.since);
    const limit = input.limit ?? 20;

    return this.logs
      .filter((log) => log.severity === "ERROR")
      .filter((log) => input.machineId === undefined || log.machineId === input.machineId)
      .filter((log) => sinceTime === undefined || Date.parse(log.timestamp) >= sinceTime)
      .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
      .slice(0, limit)
      .map(cloneLog);
  }
}

function cloneMachine(machine: MachineSummary): MachineSummary {
  return {
    ...machine,
    issues: [...machine.issues]
  };
}

function cloneLog(log: LogEntry): LogEntry {
  return { ...log };
}
