import { KnowledgeSnippet as PrismaSnippet } from '@prisma/client';
import {
  KnowledgeSnippet,
  SnippetSource,
} from '../../domain/knowledge-snippet.entity';
import { UniqueEntityID } from '../../../../shared/domain/unique-entity-id';

export class KnowledgeMapper {
  public static toDomain(raw: PrismaSnippet): KnowledgeSnippet {
    const snippetOrError = KnowledgeSnippet.create(
      {
        userId: new UniqueEntityID(raw.userId),
        content: raw.content,
        tags: raw.tags,
        source: raw.source as SnippetSource,
      },
      new UniqueEntityID(raw.id),
    );

    if (snippetOrError.isFailure) {
      const errorMessage =
        typeof snippetOrError.error === 'string'
          ? snippetOrError.error
          : JSON.stringify(snippetOrError.error);
      throw new Error(`Invalid snippet in DB: ${errorMessage}`);
    }

    return snippetOrError.getValue();
  }

  public static toPersistence(snippet: KnowledgeSnippet): PrismaSnippet {
    return {
      id: snippet.id.toString(),
      userId: snippet.userId.toString(),
      content: snippet.content,
      tags: snippet.tags,
      source: snippet.source,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
