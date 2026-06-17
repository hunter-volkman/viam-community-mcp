export type ViamMcpErrorCode = "invalid_input" | "missing_config" | "live_viam_error" | "tool_error";

export interface SafeToolError {
  code: ViamMcpErrorCode;
  message: string;
  retryable: false;
}

export class ViamMcpError extends Error {
  readonly code: ViamMcpErrorCode;
  readonly retryable = false;

  constructor(code: ViamMcpErrorCode, message: string) {
    super(message);
    this.name = "ViamMcpError";
    this.code = code;
  }
}

export function redactSensitiveText(value: string): string {
  return value
    .replace(/\b(VIAM_API_KEY_ID|VIAM_API_KEY)\s*[:=]\s*["']?[^"',\s;]+["']?/gi, "$1=[redacted]")
    .replace(/\b(authEntity|payload)\s*[:=]\s*["']?[^"',\s;]+["']?/gi, "$1=[redacted]")
    .replace(/\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Authorization: Bearer [redacted]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/\b(?=[A-Za-z0-9_-]{32,}\b)(?=[A-Za-z0-9_-]*[A-Za-z])(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]{32,}\b/g, "[redacted]");
}

export function toSafeToolError(error: unknown): SafeToolError {
  const message = redactSensitiveText(errorMessage(error));

  if (error instanceof ViamMcpError) {
    return {
      code: error.code,
      message,
      retryable: false
    };
  }

  return {
    code: "tool_error",
    message: message.length > 0 ? message : "Unexpected tool error.",
    retryable: false
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unexpected tool error.";
}
