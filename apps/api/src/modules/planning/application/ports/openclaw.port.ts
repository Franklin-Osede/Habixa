import {
  OpenClawRequestDto,
  OpenClawResponseDto,
} from '../openclaw/openclaw.dto';

export const OPEN_CLAW_PORT = 'OPEN_CLAW_PORT';

export interface OpenClawPort {
  generatePlan(request: OpenClawRequestDto): Promise<OpenClawResponseDto>;
}
