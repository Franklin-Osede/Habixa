import { Injectable } from '@nestjs/common';
import { KnowledgeRepository } from '../../domain/repositories/knowledge.repository';
import { KnowledgeSnippet } from '../../domain/knowledge-snippet.entity';
import { PrismaService } from '../../../../common/prisma.service';
import { KnowledgeMapper } from '../mappers/knowledge.mapper';

@Injectable()
export class PrismaKnowledgeRepository implements KnowledgeRepository {
  constructor(private prisma: PrismaService) {}

  async save(snippet: KnowledgeSnippet): Promise<void> {
    const data = KnowledgeMapper.toPersistence(snippet);

    await this.prisma.knowledgeSnippet.upsert({
      where: { id: data.id },
      update: {
        content: data.content,
        tags: data.tags,
        source: data.source,
        updatedAt: new Date(),
      },
      create: {
        id: data.id,
        userId: data.userId,
        content: data.content,
        tags: data.tags,
        source: data.source,
      },
    });
  }
}
