/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  CoachLlmContentBlock,
  CoachLlmInputMessage,
  CoachLlmPort,
  CoachLlmRequest,
  CoachLlmResponse,
} from '../application/ports/coach-llm.port';

/**
 * Production CoachLlmPort backed by the OpenAI Chat Completions API.
 *
 * Defaults to gpt-4o-mini because it's ~20x cheaper than Sonnet and
 * sufficient for a coach demo / early-stage product. Override with the
 * COACH_MODEL env var (e.g. "gpt-4o" or "gpt-4-turbo") when quality
 * matters more than cost.
 *
 * The mapping work this adapter does:
 *   - CoachLlmPort uses Anthropic-shaped content blocks (text /
 *     tool_use / tool_result). OpenAI uses tool_calls on assistant
 *     messages and a dedicated `role: "tool"` message per result.
 *     translateToOpenAi / translateFromOpenAi keep both worlds happy
 *     so the orchestration layer stays provider-agnostic.
 */
@Injectable()
export class OpenAiCoachLlm implements CoachLlmPort {
  private readonly logger = new Logger(OpenAiCoachLlm.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      this.logger.warn(
        'No OPENAI_API_KEY in env — coach calls will fail until one is set.',
      );
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.COACH_MODEL ?? 'gpt-4o-mini';
  }

  async generate(request: CoachLlmRequest): Promise<CoachLlmResponse> {
    const messages = [
      { role: 'system', content: request.systemPrompt },
      ...this.translateToOpenAi(request.messages),
    ];

    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: request.maxTokens ?? 1024,
      messages: messages as never,
      tools: request.tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema as never,
        },
      })),
    });

    const choice = response.choices[0];
    if (!choice) {
      return { stopReason: 'end_turn', content: [] };
    }

    const blocks: CoachLlmContentBlock[] = [];
    if (choice.message.content) {
      blocks.push({ type: 'text', text: choice.message.content });
    }
    for (const call of choice.message.tool_calls ?? []) {
      if (call.type !== 'function') continue;
      let parsedInput: Record<string, unknown> = {};
      try {
        parsedInput = JSON.parse(call.function.arguments || '{}');
      } catch {
        // Fall back to empty input if the model returned invalid JSON;
        // the registry will reject it on Zod validation and the loop
        // will surface the error back to the model.
      }
      blocks.push({
        type: 'tool_use',
        id: call.id,
        name: call.function.name,
        input: parsedInput,
      });
    }

    const stopReason =
      choice.finish_reason === 'tool_calls' ? 'tool_use' : 'end_turn';

    return { stopReason, content: blocks };
  }

  private translateToOpenAi(messages: CoachLlmInputMessage[]): unknown[] {
    const out: unknown[] = [];
    for (const msg of messages) {
      if (msg.role === 'user') {
        out.push({ role: 'user', content: msg.content });
        continue;
      }

      if (msg.role === 'assistant') {
        // Assistant content can be either a string (legacy / plain text)
        // or an array of CoachLlmContentBlock when we replay a previous
        // turn. OpenAI expects tool calls in a separate `tool_calls`
        // field, plain text in `content`.
        if (typeof msg.content === 'string') {
          out.push({ role: 'assistant', content: msg.content });
          continue;
        }
        const text = msg.content
          .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
          .map((b) => b.text)
          .join('\n');
        const toolCalls = msg.content
          .filter(
            (b): b is { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
              b.type === 'tool_use',
          )
          .map((b) => ({
            id: b.id,
            type: 'function',
            function: {
              name: b.name,
              arguments: JSON.stringify(b.input ?? {}),
            },
          }));

        out.push({
          role: 'assistant',
          content: text || null,
          ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
        });
        continue;
      }

      // role === 'tool'. Each tool_result block becomes its own
      // role:"tool" message — OpenAI does not group them.
      const blocks = (Array.isArray(msg.content) ? msg.content : []) as Array<{
        type: 'tool_result';
        tool_use_id: string;
        content: string;
        is_error?: boolean;
      }>;
      for (const block of blocks) {
        out.push({
          role: 'tool',
          tool_call_id: block.tool_use_id,
          content: block.content,
        });
      }
    }
    return out;
  }
}
