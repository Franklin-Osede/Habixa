import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { OpenClawPort } from '../../application/ports/openclaw.port';
import {
  OpenClawRequestDto,
  OpenClawResponseDto,
} from '../../application/openclaw/openclaw.dto';

@Injectable()
export class OpenClawHttpClient implements OpenClawPort {
  private readonly logger = new Logger(OpenClawHttpClient.name);

  // Hardcoded for MVP, in production this should be in .env (e.g., configService.get('OPENCLAW_API_URL'))
  private readonly apiUrl =
    process.env.OPENCLAW_API_URL || 'http://localhost:8000';

  async generatePlan(
    request: OpenClawRequestDto,
  ): Promise<OpenClawResponseDto> {
    this.logger.log(
      `Sending plan generation request to OpenClaw for user ${request.userId}...`,
    );

    try {
      const response = await axios.post<OpenClawResponseDto>(
        `${this.apiUrl}/generate`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
            // Future Auth here: 'Authorization': `Bearer ${process.env.OPENCLAW_API_KEY}`
          },
          // Timeout set high as generation might take 30-120 seconds
          timeout: 120000,
        },
      );

      this.logger.log(`Plan generation completed for user ${request.userId}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to generate plan from OpenClaw for user ${request.userId}: ${error.message}`,
      );
      throw error;
    }
  }
}
