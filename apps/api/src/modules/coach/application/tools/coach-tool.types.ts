import { z } from 'zod';

/**
 * Context passed to every tool invocation. Tools that need user-specific
 * data (today's plan, adherence...) receive the userId here so they can
 * scope their queries; the orchestration layer is responsible for never
 * leaking another user's data into the call.
 */
export interface CoachToolContext {
  userId: string;
  /** UTC moment "now" — fixed per request so tools agree on what "today" means. */
  now: Date;
}

/**
 * One coach tool. The execute function returns a JSON-serializable value
 * that becomes the tool_result content fed back to the LLM. Errors throw;
 * the orchestrator catches them and surfaces them as is_error=true so the
 * LLM can react.
 */
export interface CoachTool<I = unknown, O = unknown> {
  name: string;
  description: string;
  inputSchema: z.ZodType<I>;
  execute(input: I, context: CoachToolContext): Promise<O>;
}

/**
 * Convert a Zod schema to a JSON Schema for the LLM. Anthropic's tool
 * definitions take input_schema as JSON Schema. Zod 4 has a built-in
 * helper, but we keep this thin wrapper so we can swap if it stops
 * matching Anthropic's expectations.
 */
export function toJsonSchema(zodSchema: z.ZodType): Record<string, unknown> {
  // z.toJSONSchema is provided by Zod 4. Anthropic expects a top-level
  // object with type=object and properties; Zod produces this directly
  // when the root schema is z.object.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return (z as unknown as { toJSONSchema: (s: z.ZodType) => Record<string, unknown> })
    .toJSONSchema(zodSchema);
}
