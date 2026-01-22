import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { KnowledgeRepository } from '../domain/repositories/knowledge.repository';

interface DeleteSnippetRequest {
  id: string;
  userId: string;
}

@Injectable()
export class DeleteKnowledgeSnippetUseCase implements UseCase<
  DeleteSnippetRequest,
  Promise<Result<void>>
> {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async execute(request: DeleteSnippetRequest): Promise<Result<void>> {
    const snippet = await this.knowledgeRepository.findById(request.id);

    if (!snippet) {
      return Result.fail('Snippet not found');
    }

    if (snippet.userId.toString() !== request.userId) {
      return Result.fail('Unauthorized access to snippet');
    }

    await this.knowledgeRepository.delete(request.id);

    return Result.ok();
  }
}
