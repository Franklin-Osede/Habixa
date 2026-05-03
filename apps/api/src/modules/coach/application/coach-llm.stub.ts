import {
  CoachLlmPort,
  CoachLlmRequest,
  CoachLlmResponse,
} from './ports/coach-llm.port';

/**
 * Scripted in-memory CoachLlmPort for tests. Returns the queued responses
 * in order. Captures every request so assertions can verify what the
 * orchestration layer actually sent (system prompt, history, tool defs).
 */
export class CoachLlmStub implements CoachLlmPort {
  private cursor = 0;
  readonly receivedRequests: CoachLlmRequest[] = [];

  constructor(private readonly script: CoachLlmResponse[]) {}

  generate(request: CoachLlmRequest): Promise<CoachLlmResponse> {
    this.receivedRequests.push(request);
    if (this.cursor >= this.script.length) {
      throw new Error(
        `CoachLlmStub: no more scripted responses (calls=${this.cursor + 1})`,
      );
    }
    const response = this.script[this.cursor];
    this.cursor += 1;
    return Promise.resolve(response);
  }
}

export function textTurn(text: string): CoachLlmResponse {
  return {
    stopReason: 'end_turn',
    content: [{ type: 'text', text }],
  };
}

export function toolUseTurn(
  id: string,
  name: string,
  input: Record<string, unknown>,
): CoachLlmResponse {
  return {
    stopReason: 'tool_use',
    content: [{ type: 'tool_use', id, name, input }],
  };
}
