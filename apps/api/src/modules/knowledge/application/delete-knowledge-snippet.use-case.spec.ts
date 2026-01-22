import { DeleteKnowledgeSnippetUseCase } from './delete-knowledge-snippet.use-case';
import { KnowledgeRepository } from '../domain/repositories/knowledge.repository';
import { KnowledgeSnippet } from '../domain/knowledge-snippet.entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

describe('DeleteKnowledgeSnippetUseCase', () => {
  let useCase: DeleteKnowledgeSnippetUseCase;
  let mockRepository: jest.Mocked<KnowledgeRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findAllByUserId: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new DeleteKnowledgeSnippetUseCase(mockRepository);
  });

  it('should delete snippet if found and authorized', async () => {
    const userId = new UniqueEntityID();
    const snippet = KnowledgeSnippet.create({
      userId: userId,
      content: 'Content',
      tags: [],
      source: 'manual',
    }).getValue();

    mockRepository.findById.mockResolvedValue(snippet);
    mockRepository.delete.mockResolvedValue(undefined);

    const result = await useCase.execute({
      id: snippet.id.toString(),
      userId: userId.toString(),
    });

    expect(result.isSuccess).toBe(true);
    expect(mockRepository.delete).toHaveBeenCalledWith(snippet.id.toString());
  });

  it('should fail if unauthorized', async () => {
    const userId = new UniqueEntityID();
    const snippet = KnowledgeSnippet.create({
      userId: userId,
      content: 'Content',
      tags: [],
      source: 'manual',
    }).getValue();

    mockRepository.findById.mockResolvedValue(snippet);

    const result = await useCase.execute({
      id: snippet.id.toString(),
      userId: 'other-user',
    });

    expect(result.isFailure).toBe(true);
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });
});
