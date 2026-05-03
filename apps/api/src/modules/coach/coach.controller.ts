/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CoachService } from './application/coach.service';
import { PrismaService } from '../../common/prisma.service';

@ApiTags('Coach')
@Controller('coach')
export class CoachController {
  constructor(
    private readonly coachService: CoachService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send a message to the AI coach',
    description:
      'Drives the tool-use loop with Claude. The coach grounds every reply ' +
      'with calls to read-only tools (get_today_plan, get_adherence) so it ' +
      "never invents user data. Returns the assistant's plain-text reply " +
      'plus the conversationId to use on subsequent turns.',
  })
  @Post('message')
  async sendMessage(
    @Body()
    body: { conversationId?: string; message?: string },
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!userId) throw new BadRequestException('User not authenticated');
    if (!body.message || body.message.trim().length === 0) {
      throw new BadRequestException('message is required');
    }

    const result = await this.coachService.sendMessage({
      userId,
      message: body.message.trim(),
      conversationId: body.conversationId,
      now: new Date(),
    });

    return {
      conversationId: result.conversationId,
      reply: result.replyText,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List the latest coach conversations for the user' })
  @Get('conversations')
  async listConversations(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!userId) throw new BadRequestException('User not authenticated');
    const conversations = await this.prisma.coachConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
    return { conversations };
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Load the visible message history of a conversation' })
  @Get('conversations/:id/messages')
  async getMessages(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!userId) throw new BadRequestException('User not authenticated');
    const conversation = await this.prisma.coachConversation.findUnique({
      where: { id },
    });
    if (!conversation || conversation.userId !== userId) {
      throw new BadRequestException('Conversation not found');
    }
    const messages = await this.prisma.coachMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, createdAt: true },
    });
    // Hide raw tool-call payloads from the client-facing list. The user
    // does not need to see "tool" rows; they only matter for the LLM loop.
    const visible = messages.filter(
      (m) => m.role === 'user' || m.role === 'assistant',
    );
    return { conversationId: id, messages: visible };
  }
}
