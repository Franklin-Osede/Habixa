import { KnowledgeSnippet } from './knowledge-snippet.entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

describe('KnowledgeSnippet Aggregate', () => {
  it('should create a valid snippet', () => {
    const result = KnowledgeSnippet.create({
      userId: new UniqueEntityID(),
      content: 'This is some important knowledge.',
      tags: ['test', 'important'],
      source: 'manual',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().content).toBe('This is some important knowledge.');
  });

  it('should fail if content is empty', () => {
    const result = KnowledgeSnippet.create({
      userId: new UniqueEntityID(),
      content: '',
      tags: [],
      source: 'manual',
    });

    expect(result.isFailure).toBe(true);
  });
});
