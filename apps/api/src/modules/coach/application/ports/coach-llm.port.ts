/**
 * Provider-agnostic contract for the LLM that drives the coach chat.
 *
 * The shape borrows from Anthropic's tool-use loop because that's the
 * primary target, but the same fields cover OpenAI's function-calling
 * and Google's tool-use APIs almost verbatim. Keeping this in our own
 * domain types means we can swap providers (Anthropic <-> OpenAI <->
 * test stub) without touching the orchestration layer.
 */

export type CoachMessageRole = 'user' | 'assistant' | 'tool';

export interface CoachToolDefinition {
  name: string;
  description: string;
  /** JSON Schema describing the tool input (Anthropic input_schema). */
  inputSchema: Record<string, unknown>;
}

export interface CoachLlmTextBlock {
  type: 'text';
  text: string;
}

export interface CoachLlmToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export type CoachLlmContentBlock = CoachLlmTextBlock | CoachLlmToolUseBlock;

export interface CoachLlmInputMessage {
  role: CoachMessageRole;
  /**
   * For user messages this is the plain user text. For assistant messages
   * it's the array of content blocks the LLM produced previously. For
   * tool messages it's the tool result keyed by toolCallId.
   */
  content:
    | string
    | CoachLlmContentBlock[]
    | Array<{
        type: 'tool_result';
        tool_use_id: string;
        content: string;
        is_error?: boolean;
      }>;
}

export interface CoachLlmRequest {
  systemPrompt: string;
  messages: CoachLlmInputMessage[];
  tools: CoachToolDefinition[];
  /** Hard cap on output tokens. */
  maxTokens?: number;
}

export interface CoachLlmResponse {
  /** Why the model stopped: "end_turn" | "tool_use" | "max_tokens". */
  stopReason: string;
  content: CoachLlmContentBlock[];
}

export const COACH_LLM_PORT = Symbol('COACH_LLM_PORT');

export interface CoachLlmPort {
  generate(request: CoachLlmRequest): Promise<CoachLlmResponse>;
}
