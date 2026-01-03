import { z } from "zod";

/**
 * Trust levels for tool approval:
 * - "full": Auto-approve all operations (dangerous, for trusted environments)
 * - "standard": Auto-approve reads/lists, prompt for writes/commands
 * - "paranoid": Prompt for all operations including reads
 */
export type TrustLevel = "full" | "standard" | "paranoid";

/**
 * Tool action info for UI display
 */
export type ToolActionInfo = {
  toolName: string;
  target: string;
};

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

export const EditSchema = z.object({
  path: z.string().min(1, "Path is required"),
  old_string: z.string(),
  new_string: z.string()
});

export type Edit = z.infer<typeof EditSchema>;

export const MultiEditArgsSchema = z.object({
  edits: z.array(EditSchema).min(1, "At least one edit is required")
});

export type MultiEditArgs = z.infer<typeof MultiEditArgsSchema>;

export const GlobArgsSchema = z.object({
  pattern: z.string().min(1, "Pattern is required"),
  path: z.string().optional()
});

export type GlobArgs = z.infer<typeof GlobArgsSchema>;

export const ReadFileArgsSchema = z.object({
  path: z.string().min(1, "Path is required")
});

export type ReadFileArgs = z.infer<typeof ReadFileArgsSchema>;

export const WriteFileArgsSchema = z.object({
  path: z.string().min(1, "Path is required"),
  content: z.string()
});

export type WriteFileArgs = z.infer<typeof WriteFileArgsSchema>;

export const EditFileArgsSchema = z.object({
  path: z.string().min(1, "Path is required"),
  old_string: z.string(),
  new_string: z.string()
});

export type EditFileArgs = z.infer<typeof EditFileArgsSchema>;

export const RunCommandArgsSchema = z.object({
  command: z.string().min(1, "Command is required")
});

export type RunCommandArgs = z.infer<typeof RunCommandArgsSchema>;

export const GitCommitArgsSchema = z.object({
  message: z.string().min(1, "Commit message is required")
});

export type GitCommitArgs = z.infer<typeof GitCommitArgsSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Validate tool arguments against a schema
 */
export function validateToolArgs<T>(
  schema: z.ZodSchema<T>,
  args: unknown,
  toolName: string
): ValidationResult<T> {
  const result = schema.safeParse(args);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    return {
      success: false,
      error: `Invalid arguments for ${toolName}: ${issues}`
    };
  }
  return { success: true, data: result.data };
}

/**
 * Validate and throw on failure
 */
export function validateToolArgsOrThrow<T>(
  schema: z.ZodSchema<T>,
  args: unknown,
  toolName: string
): T {
  const result = validateToolArgs(schema, args, toolName);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data;
}
