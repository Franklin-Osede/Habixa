import { Injectable } from '@nestjs/common';
import { PlanRepository } from '../../domain/repositories/plan.repository';
import { DailyPlan } from '../../domain/daily-plan.entity';
import { PrismaService } from '../../../../common/prisma.service';
import { PlanMapper } from '../mappers/plan.mapper';

@Injectable()
export class PrismaPlanRepository implements PlanRepository {
  constructor(private prisma: PrismaService) {}

  async save(plan: DailyPlan): Promise<void> {
    const data = PlanMapper.toPersistence(plan);

    await this.prisma.$transaction(async (tx) => {
      // Upsert Plan
      await tx.dailyPlan.upsert({
        where: { id: data.id },
        update: { updatedAt: new Date() },
        create: {
          id: data.id,
          userId: data.userId,
          date: data.date,
        },
      });

      // Handle items (simplistic: delete all and recreate, or upsert each)
      // For MVP simplicity, let's just create new ones if they don't exist,
      // but proper way is diffing. Here we just loop upsert.
      for (const item of data.items) {
        await tx.planItem.upsert({
          where: { id: item.id },
          update: {
            isCompleted: item.isCompleted,
            title: item.title,
            description: item.description,
          },
          create: {
            id: item.id,
            planId: data.id,
            title: item.title,
            description: item.description,
            isCompleted: item.isCompleted,
          },
        });
      }
    });
  }

  async findByUserIdAndDate(
    userId: string,
    date: Date,
  ): Promise<DailyPlan | null> {
    // Prisma date filtering might require range or exact match logic depending on time
    // Assuming simple date check for now, potentially ignoring time components in real app logic
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const raw = await this.prisma.dailyPlan.findFirst({
      where: {
        userId: userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: { items: true },
    });

    if (!raw) return null;

    return PlanMapper.toDomain(raw);
  }
}
