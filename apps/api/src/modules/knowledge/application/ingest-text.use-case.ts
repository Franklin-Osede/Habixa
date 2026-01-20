import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { KnowledgeSnippet } from '../domain/knowledge-snippet.entity';
import { IngestTextDto } from './dtos/ingest-text.dto';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';
import { KnowledgeRepository } from '../domain/repositories/knowledge.repository';

@Injectable()
export class IngestTextUseCase implements UseCase<
  IngestTextDto,
  Promise<Result<KnowledgeSnippet>>
> {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async execute(request: IngestTextDto): Promise<Result<KnowledgeSnippet>> {
    const snippetOrError = KnowledgeSnippet.create({
      userId: new UniqueEntityID(request.userId),
      content: request.content,
      tags: request.tags || [],
      source: request.source,
    });

    if (snippetOrError.isFailure) {
      return Result.fail(snippetOrError.error as string);
    }

    const snippet = snippetOrError.getValue();
    await this.knowledgeRepository.save(snippet);

    return Result.ok(snippet);
  }
}
