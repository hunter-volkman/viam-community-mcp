#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { toSafeToolError } from "./errors.js";
import { createViamMcpServer } from "./server.js";
import { FakeViamClient } from "./viam/fakeClient.js";

async function main(): Promise<void> {
  const server = createViamMcpServer(new FakeViamClient());
  await server.connect(new StdioServerTransport());
}

try {
  await main();
} catch (error) {
  const safeError = toSafeToolError(error);
  console.error(`${safeError.code}: ${safeError.message}`);
  process.exitCode = 1;
}
