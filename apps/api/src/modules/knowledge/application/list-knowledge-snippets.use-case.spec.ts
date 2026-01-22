import { ListKnowledgeSnippetsUseCase } from './list-knowledge-snippets.use-case';
import { KnowledgeRepository } from '../domain/repositories/knowledge.repository';
import { KnowledgeSnippet } from '../domain/knowledge-snippet.entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

describe('ListKnowledgeSnippetsUseCase', () => {
  let useCase: ListKnowledgeSnippetsUseCase;
  let mockRepository: jest.Mocked<KnowledgeRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findAllByUserId: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new ListKnowledgeSnippetsUseCase(mockRepository);
  });

  it('should list snippets successfully', async () => {
    const userId = new UniqueEntityID();
    const snippet = KnowledgeSnippet.create({
      userId: userId,
      content: 'Test content',
      tags: ['test'],
      source: 'manual',
    }).getValue();

    mockRepository.findAllByUserId.mockResolvedValue([snippet]);

    const result = await useCase.execute({ userId: userId.toString() });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toHaveLength(1);
    expect(result.getValue()[0].content).toBe('Test content');
  });

  it('should use default pagination', async () => {
    const userId = 'user-1';
    mockRepository.findAllByUserId.mockResolvedValue([]);

    await useCase.execute({ userId });

    expect(mockRepository.findAllByUserId).toHaveBeenCalledWith(userId, 0, 20);
  });

  it('should use provided pagination', async () => {
    const userId = 'user-1';
    mockRepository.findAllByUserId.mockResolvedValue([]);

    await useCase.execute({ userId, page: 2, limit: 10 });

    expect(mockRepository.findAllByUserId).toHaveBeenCalledWith(userId, 10, 10);
  });
});
