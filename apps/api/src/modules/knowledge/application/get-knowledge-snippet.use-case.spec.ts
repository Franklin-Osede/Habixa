import { GetKnowledgeSnippetUseCase } from './get-knowledge-snippet.use-case';
import { KnowledgeRepository } from '../domain/repositories/knowledge.repository';
import { KnowledgeSnippet } from '../domain/knowledge-snippet.entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

describe('GetKnowledgeSnippetUseCase', () => {
  let useCase: GetKnowledgeSnippetUseCase;
  let mockRepository: jest.Mocked<KnowledgeRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findAllByUserId: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new GetKnowledgeSnippetUseCase(mockRepository);
  });

  it('should return snippet if found and authorized', async () => {
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
      userId: userId.toString(),
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().content).toBe('Content');
  });

  it('should fail if not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      id: '123',
      userId: 'user-1',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Snippet not found');
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
    expect(result.error).toContain('Unauthorized');
  });
});
