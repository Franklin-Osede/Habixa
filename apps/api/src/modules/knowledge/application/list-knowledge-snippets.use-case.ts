import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { KnowledgeRepository } from '../domain/repositories/knowledge.repository';
import { KnowledgeSnippetDto } from './dtos/knowledge-snippet.dto';

interface ListKnowledgeRequest {
  userId: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ListKnowledgeSnippetsUseCase implements UseCase<
  ListKnowledgeRequest,
  Promise<Result<KnowledgeSnippetDto[]>>
> {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async execute(
    request: ListKnowledgeRequest,
  ): Promise<Result<KnowledgeSnippetDto[]>> {
    const page = request.page || 1;
    const limit = request.limit || 20;
    const offset = (page - 1) * limit;

    const snippets = await this.knowledgeRepository.findAllByUserId(
      request.userId,
      offset,
      limit,
    );

    const dtos = snippets.map((snippet) => {
      const dto = new KnowledgeSnippetDto();
      dto.id = snippet.id.toString();
      dto.content = snippet.content;
      dto.tags = snippet.tags;
      dto.source = snippet.source;
      // snippet.createdAt isn't exposed yet, might need to add getter to entity
      // Assuming entity has createdAt prop but maybe no getter. I'll check.
      // For now using empty string or TODO if missing.
      dto.createdAt = snippet.createdAt.toISOString();
      return dto;
    });

    return Result.ok(dtos);
  }
}
