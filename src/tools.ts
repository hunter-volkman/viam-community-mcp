import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod/v4";
import { toSafeToolError, ViamMcpError } from "./errors.js";
import type { LogEntry, MachineSummary, RecentErrorsInput, ViamClient, WhoamiResult } from "./viam/client.js";

export const M1_TOOL_NAMES = [
  "viam_whoami",
  "viam_list_machines",
  "viam_get_recent_errors",
  "viam_summarize_fleet_health"
] as const;

export type M1ToolName = (typeof M1_TOOL_NAMES)[number];

const sinceInputSchema = z.iso
  .datetime()
  .describe("ISO 8601 datetime. Example: 2026-06-17T13:55:00.000Z.");

export const noInputSchema = z.object({}).strict().default({});

export const recentErrorsInputSchema = defaultedObjectSchema(
  z
    .object({
      machineId: z.string().min(1).max(128).optional(),
      since: sinceInputSchema.optional(),
      limit: z.number().int().min(1).max(50).optional()
    })
    .strict()
);

export const fleetHealthInputSchema = defaultedObjectSchema(
  z
    .object({
      recentErrorLimit: z.number().int().min(1).max(50).optional()
    })
    .strict()
);

type ZodSchemaMetadata = {
  _zod?: {
    def?: {
      shape?: unknown;
    };
  };
};

function defaultedObjectSchema<T extends z.ZodObject>(schema: T): z.ZodDefault<T> {
  const defaultedSchema = schema.default({} as Exclude<z.output<T>, undefined>);
  const defaultedMetadata = defaultedSchema as ZodSchemaMetadata;
  const objectMetadata = schema as ZodSchemaMetadata;

  // The MCP SDK exports JSON Schema only when it can see object shape metadata.
  if (defaultedMetadata._zod?.def && objectMetadata._zod?.def?.shape !== undefined) {
    defaultedMetadata._zod.def.shape = objectMetadata._zod.def.shape;
  }

  return defaultedSchema;
}

export type RecentErrorsToolInput = z.infer<typeof recentErrorsInputSchema>;
export type FleetHealthToolInput = z.infer<typeof fleetHealthInputSchema>;

export interface WhoamiToolOutput {
  authenticated: boolean;
  mode: "fake";
  subject: string;
  org: WhoamiResult["org"];
  warnings: string[];
}

export interface ListMachinesToolOutput {
  machineCount: number;
  machines: MachineSummary[];
  unknowns: string[];
}

export interface RecentErrorsToolOutput {
  filters: {
    machineId?: string;
    since?: string;
    limit: number;
  };
  errorCount: number;
  errors: LogEntry[];
  unknowns: string[];
}

export interface FleetHealthToolOutput {
  machineCount: number;
  healthyMachineCount: number;
  unhealthyMachineCount: number;
  offlineMachineCount: number;
  unhealthyMachines: MachineSummary[];
  recentErrors: LogEntry[];
  inspectFirst: MachineInspectionHint[];
  unknowns: string[];
}

export interface MachineInspectionHint {
  machineId: string;
  machineName: string;
  reason: string;
  evidence: string[];
}

export async function viamWhoami(client: ViamClient): Promise<WhoamiToolOutput> {
  const identity = await client.whoami();

  return {
    ...identity,
    warnings: ["Using deterministic fake data. Live Viam calls are not implemented in M1."]
  };
}

export async function viamListMachines(client: ViamClient): Promise<ListMachinesToolOutput> {
  const machines = await client.listMachines();

  return {
    machineCount: machines.length,
    machines,
    unknowns: ["Live Viam connectivity and data sync status are not checked by the fake client."]
  };
}

export async function viamGetRecentErrors(
  client: ViamClient,
  input: RecentErrorsToolInput = {}
): Promise<RecentErrorsToolOutput> {
  const normalized = normalizeRecentErrorsInput(input);
  const errors = await client.getRecentErrors(normalized);

  return {
    filters: normalized,
    errorCount: errors.length,
    errors,
    unknowns: ["Only deterministic fake error logs are available in M1."]
  };
}

export async function viamSummarizeFleetHealth(
  client: ViamClient,
  input: FleetHealthToolInput = {}
): Promise<FleetHealthToolOutput> {
  const recentErrorLimit = normalizeLimit(input.recentErrorLimit, 10, "recentErrorLimit");
  const machines = await client.listMachines();
  const recentErrors = await client.getRecentErrors({ limit: recentErrorLimit });
  const unhealthyMachines = machines.filter(isUnhealthyMachine);

  return {
    machineCount: machines.length,
    healthyMachineCount: machines.length - unhealthyMachines.length,
    unhealthyMachineCount: unhealthyMachines.length,
    offlineMachineCount: machines.filter((machine) => machine.status === "offline").length,
    unhealthyMachines,
    recentErrors,
    inspectFirst: buildInspectionHints(machines, recentErrors),
    unknowns: [
      "Live Viam connectivity, data sync status, and full machine configuration are not available in fake-client M1."
    ]
  };
}

export async function callToolSafely<T extends object>(operation: () => Promise<T>): Promise<CallToolResult> {
  try {
    return toToolResult(await operation());
  } catch (error) {
    const safeError = toSafeToolError(error);

    return {
      isError: true,
      structuredContent: { error: safeError },
      content: [{ type: "text", text: JSON.stringify({ error: safeError }, null, 2) }]
    };
  }
}

function toToolResult<T extends object>(output: T): CallToolResult {
  return {
    structuredContent: output as Record<string, unknown>,
    content: [{ type: "text", text: JSON.stringify(output, null, 2) }]
  };
}

function normalizeRecentErrorsInput(input: RecentErrorsToolInput): RecentErrorsInput & { limit: number } {
  return {
    ...optionalString("machineId", input.machineId),
    ...optionalSince(input.since),
    limit: normalizeLimit(input.limit, 20, "limit")
  };
}

function optionalString(key: "machineId", value: string | undefined): Pick<RecentErrorsInput, "machineId"> {
  return value === undefined ? {} : { [key]: value };
}

function optionalSince(value: string | undefined): Pick<RecentErrorsInput, "since"> {
  if (value === undefined) {
    return {};
  }

  const parsed = sinceInputSchema.safeParse(value);
  if (!parsed.success) {
    throw new ViamMcpError("invalid_input", "since must be an ISO datetime string.");
  }

  return { since: new Date(parsed.data).toISOString() };
}

function normalizeLimit(value: number | undefined, fallback: number, fieldName: string): number {
  if (value === undefined) {
    return fallback;
  }

  if (!Number.isInteger(value) || value < 1 || value > 50) {
    throw new ViamMcpError("invalid_input", `${fieldName} must be an integer from 1 to 50.`);
  }

  return value;
}

function isUnhealthyMachine(machine: MachineSummary): boolean {
  return machine.health !== "healthy" || machine.status === "offline";
}

function buildInspectionHints(machines: MachineSummary[], recentErrors: LogEntry[]): MachineInspectionHint[] {
  const errorsByMachine = new Map<string, LogEntry[]>();
  for (const error of recentErrors) {
    errorsByMachine.set(error.machineId, [...(errorsByMachine.get(error.machineId) ?? []), error]);
  }

  const candidates = machines.filter((machine) => isUnhealthyMachine(machine) || errorsByMachine.has(machine.id));

  return candidates.slice(0, 3).map((machine) => {
    const machineErrors = errorsByMachine.get(machine.id) ?? [];
    return {
      machineId: machine.id,
      machineName: machine.name,
      reason: inspectionReason(machine, machineErrors),
      evidence: [
        `status=${machine.status}`,
        `health=${machine.health}`,
        ...machine.issues,
        ...machineErrors.slice(0, 2).map((error) => `${error.timestamp} ${error.severity}: ${error.message}`)
      ]
    };
  });
}

function inspectionReason(machine: MachineSummary, machineErrors: LogEntry[]): string {
  if (machine.status === "offline") {
    return "Machine is offline.";
  }

  if (machine.health !== "healthy") {
    return "Machine health is not healthy.";
  }

  return `${machineErrors.length} recent error log(s) found.`;
}
