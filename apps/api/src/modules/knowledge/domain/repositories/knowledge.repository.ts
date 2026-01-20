import { KnowledgeSnippet } from '../knowledge-snippet.entity';

export abstract class KnowledgeRepository {
  abstract save(snippet: KnowledgeSnippet): Promise<void>;
  // Future: search(query: string): Promise<KnowledgeSnippet[]>;
}
