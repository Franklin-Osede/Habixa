import { IngestTextUseCase } from './ingest-text.use-case';
import { KnowledgeRepository } from '../domain/repositories/knowledge.repository';
import { IngestTextDto } from './dtos/ingest-text.dto';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

describe('IngestTextUseCase', () => {
  let useCase: IngestTextUseCase;
  let mockRepository: KnowledgeRepository;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findAllByUserId: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    } as unknown as KnowledgeRepository;
    useCase = new IngestTextUseCase(mockRepository);
  });

  it('should ingest text successfully', async () => {
    const dto: IngestTextDto = {
      userId: new UniqueEntityID().toString(),
      content: 'Learning NestJS',
      tags: ['coding'],
      source: 'manual',
    };

    const result = await useCase.execute(dto);

    expect(result.isSuccess).toBe(true);
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
