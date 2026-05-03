import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import {
  CoachConversationStore,
  StoredCoachConversation,
  StoredCoachMessage,
} from '../application/ports/coach-conversation.store';

@Injectable()
export class PrismaCoachConversationStore implements CoachConversationStore {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    conversationId: string,
    userId: string,
  ): Promise<StoredCoachConversation | null> {
    const conv = await this.prisma.coachConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv || conv.userId !== userId) return null;
    return conv;
  }

  async createConversation(userId: string) {
    return this.prisma.coachConversation.create({
      data: { userId },
    });
  }

  async appendMessage(input: {
    conversationId: string;
    role: 'user' | 'assistant' | 'tool';
    content: string;
    metadata?: Record<string, unknown> | null;
  }): Promise<StoredCoachMessage> {
    const message = await this.prisma.coachMessage.create({
      data: {
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        metadata: (input.metadata ?? null) as never,
      },
    });
    // Touch the conversation so updatedAt reflects activity.
    await this.prisma.coachConversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: new Date() },
    });
    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role as 'user' | 'assistant' | 'tool',
      content: message.content,
      metadata: message.metadata as Record<string, unknown> | null,
      createdAt: message.createdAt,
    };
  }

  async loadHistory(conversationId: string): Promise<StoredCoachMessage[]> {
    const messages = await this.prisma.coachMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
    return messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role as 'user' | 'assistant' | 'tool',
      content: m.content,
      metadata: m.metadata as Record<string, unknown> | null,
      createdAt: m.createdAt,
    }));
  }
}
