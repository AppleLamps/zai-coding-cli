/**
 * Base error class for agent operations
 */
export class AgentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = "AgentError";
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AgentError.prototype);
  }
}

/**
 * Error thrown when a tool operation fails
 */
export class ToolError extends AgentError {
  constructor(
    message: string,
    public readonly toolName: string
  ) {
    super(message, "TOOL_ERROR", true);
    this.name = "ToolError";
    Object.setPrototypeOf(this, ToolError.prototype);
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends AgentError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", true);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when user denies permission
 */
export class PermissionDeniedError extends AgentError {
  constructor(operation: string) {
    super(`User denied: ${operation}`, "PERMISSION_DENIED", true);
    this.name = "PermissionDeniedError";
    Object.setPrototypeOf(this, PermissionDeniedError.prototype);
  }
}

/**
 * Error thrown when backup operations fail
 */
export class BackupError extends AgentError {
  constructor(
    message: string,
    public readonly filePath: string
  ) {
    super(message, "BACKUP_ERROR", true);
    this.name = "BackupError";
    Object.setPrototypeOf(this, BackupError.prototype);
  }
}

/**
 * Error thrown when file operations fail
 */
export class FileSystemError extends AgentError {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly operation: "read" | "write" | "delete" | "list"
  ) {
    super(message, "FS_ERROR", true);
    this.name = "FileSystemError";
    Object.setPrototypeOf(this, FileSystemError.prototype);
  }
}

/**
 * Error thrown when glob pattern is invalid
 */
export class GlobPatternError extends ValidationError {
  constructor(
    message: string,
    public readonly pattern: string
  ) {
    super(message);
    this.name = "GlobPatternError";
    Object.setPrototypeOf(this, GlobPatternError.prototype);
  }
}

/**
 * Format any error into a user-friendly string
 */
export function formatError(error: unknown): string {
  if (error instanceof AgentError) {
    return `[${error.code}] ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Check if an error is recoverable
 */
export function isRecoverable(error: unknown): boolean {
  if (error instanceof AgentError) {
    return error.recoverable;
  }
  // Non-AgentErrors are assumed to be non-recoverable
  return false;
}

/**
 * Wrap an error with additional context
 */
export function wrapError(error: unknown, context: string): AgentError {
  const message = error instanceof Error ? error.message : String(error);
  return new AgentError(`${context}: ${message}`, "WRAPPED_ERROR", true);
}
