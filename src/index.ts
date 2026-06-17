#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readViamConfig } from "./config.js";
import { toSafeToolError } from "./errors.js";
import { createViamMcpServer } from "./server.js";
import { createLiveViamClient } from "./viam/liveClient.js";

async function main(): Promise<void> {
  const viamClient = await createLiveViamClient(readViamConfig());
  const server = createViamMcpServer(viamClient);
  await server.connect(new StdioServerTransport());
}

try {
  await main();
} catch (error) {
  const safeError = toSafeToolError(error);
  console.error(`${safeError.code}: ${safeError.message}`);
  process.exitCode = 1;
}
