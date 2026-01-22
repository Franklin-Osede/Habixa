import { KnowledgeSnippet } from '../knowledge-snippet.entity';

export abstract class KnowledgeRepository {
  abstract save(snippet: KnowledgeSnippet): Promise<void>;
  abstract findAllByUserId(
    userId: string,
    offset?: number,
    limit?: number,
  ): Promise<KnowledgeSnippet[]>;
  abstract findById(id: string): Promise<KnowledgeSnippet | null>;
  abstract delete(id: string): Promise<void>;
}
