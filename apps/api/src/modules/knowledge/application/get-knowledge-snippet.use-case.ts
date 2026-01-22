import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { KnowledgeRepository } from '../domain/repositories/knowledge.repository';
import { KnowledgeSnippetDto } from './dtos/knowledge-snippet.dto';

interface GetSnippetRequest {
  id: string;
  userId: string;
}

@Injectable()
export class GetKnowledgeSnippetUseCase implements UseCase<
  GetSnippetRequest,
  Promise<Result<KnowledgeSnippetDto>>
> {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async execute(
    request: GetSnippetRequest,
  ): Promise<Result<KnowledgeSnippetDto>> {
    const snippet = await this.knowledgeRepository.findById(request.id);

    if (!snippet) {
      return Result.fail('Snippet not found');
    }

    if (snippet.userId.toString() !== request.userId) {
      return Result.fail('Unauthorized access to snippet');
    }

    const dto = new KnowledgeSnippetDto();
    dto.id = snippet.id.toString();
    dto.content = snippet.content;
    dto.tags = snippet.tags;
    dto.source = snippet.source;
    dto.createdAt = snippet.createdAt.toISOString();

    return Result.ok(dto);
  }
}
