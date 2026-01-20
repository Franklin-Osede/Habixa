import { SnippetSource } from '../../domain/knowledge-snippet.entity';

export class IngestTextDto {
  userId!: string;
  content!: string;
  tags?: string[];
  source!: SnippetSource;
}
