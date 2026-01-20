import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { IngestTextUseCase } from './application/ingest-text.use-case';
import { IngestTextDto } from './application/dtos/ingest-text.dto';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly ingestTextUseCase: IngestTextUseCase) {}

  @Post('ingest')
  async ingest(@Body() dto: IngestTextDto) {
    const result = await this.ingestTextUseCase.execute(dto);

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return result.getValue();
  }
}
