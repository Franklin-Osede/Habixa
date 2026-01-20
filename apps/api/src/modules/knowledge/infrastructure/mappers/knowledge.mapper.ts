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
      throw new Error(
        `Invalid snippet in DB: ${JSON.stringify(snippetOrError.error)}`,
      );
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
