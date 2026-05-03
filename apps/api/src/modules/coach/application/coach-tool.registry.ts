import { Injectable } from '@nestjs/common';
import { CoachToolDefinition } from './ports/coach-llm.port';
import {
  CoachTool,
  CoachToolContext,
  toJsonSchema,
} from './tools/coach-tool.types';
import { GetTodayPlanTool } from './tools/get-today-plan.tool';
import { GetAdherenceTool } from './tools/get-adherence.tool';

/**
 * Single source of truth for what tools the coach can call.
 *
 * The registry exposes:
 * - `definitions()` — the JSON-Schema list passed to the LLM as
 *   `tools` in CoachLlmRequest, so the model knows what's available.
 * - `execute(name, input, ctx)` — the orchestrator's entry point when
 *   the LLM emits a tool_use block. Validates input via Zod (defence
 *   in depth: the LLM might send slightly malformed payloads), runs
 *   the tool, and returns the result for the next LLM turn.
 */
@Injectable()
export class CoachToolRegistry {
  private readonly tools: Map<string, CoachTool>;

  constructor(
    private readonly getTodayPlan: GetTodayPlanTool,
    private readonly getAdherence: GetAdherenceTool,
  ) {
    const list: CoachTool[] = [getTodayPlan, getAdherence];
    this.tools = new Map(list.map((t) => [t.name, t]));
  }

  definitions(): CoachToolDefinition[] {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: toJsonSchema(tool.inputSchema),
    }));
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  async execute(
    name: string,
    rawInput: unknown,
    ctx: CoachToolContext,
  ): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Unknown coach tool: ${name}`);
    const parsed = tool.inputSchema.safeParse(rawInput ?? {});
    if (!parsed.success) {
      throw new Error(
        `Invalid input for ${name}: ${parsed.error.issues
          .map((i) => i.message)
          .join('; ')}`,
      );
    }
    return tool.execute(parsed.data, ctx);
  }
}
