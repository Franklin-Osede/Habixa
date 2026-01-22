import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  Query,
  Param,
  Delete,
} from '@nestjs/common';
import { IngestTextUseCase } from './application/ingest-text.use-case';
import { IngestTextDto } from './application/dtos/ingest-text.dto';
import { ListKnowledgeSnippetsUseCase } from './application/list-knowledge-snippets.use-case';
import { GetKnowledgeSnippetUseCase } from './application/get-knowledge-snippet.use-case';
import { DeleteKnowledgeSnippetUseCase } from './application/delete-knowledge-snippet.use-case';

@Controller('knowledge')
export class KnowledgeController {
  constructor(
    private readonly ingestTextUseCase: IngestTextUseCase,
    private readonly listKnowledgeSnippetsUseCase: ListKnowledgeSnippetsUseCase,
    private readonly getKnowledgeSnippetUseCase: GetKnowledgeSnippetUseCase,
    private readonly deleteKnowledgeSnippetUseCase: DeleteKnowledgeSnippetUseCase,
  ) {}

  @Post('ingest')
  async ingest(@Body() dto: IngestTextDto) {
    const result = await this.ingestTextUseCase.execute(dto);

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return result.getValue();
  }

  @Get()
  async list(
    @Query('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const result = await this.listKnowledgeSnippetsUseCase.execute({
      userId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return {
      data: result.getValue(),
      // Add meta/pagination info if use case returned it
    };
  }

  @Get(':id')
  async get(@Param('id') id: string, @Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const result = await this.getKnowledgeSnippetUseCase.execute({
      id,
      userId,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return result.getValue();
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const result = await this.deleteKnowledgeSnippetUseCase.execute({
      id,
      userId,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return { message: 'Snippet deleted successfully' };
  }
}
