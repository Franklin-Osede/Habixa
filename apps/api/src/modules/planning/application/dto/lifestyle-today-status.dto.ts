import { ApiProperty } from '@nestjs/swagger';

export const PLAN_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  GENERATING: 'GENERATING',
  FAILED: 'FAILED',
  READY: 'READY',
} as const;

export type PlanStatus = (typeof PLAN_STATUS)[keyof typeof PLAN_STATUS];

export class PlanNotStartedDto {
  @ApiProperty({ enum: [PLAN_STATUS.NOT_STARTED], example: 'NOT_STARTED' })
  status!: typeof PLAN_STATUS.NOT_STARTED;
}

export class PlanGeneratingDto {
  @ApiProperty({ enum: [PLAN_STATUS.GENERATING], example: 'GENERATING' })
  status!: typeof PLAN_STATUS.GENERATING;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Job ID for polling progress, or null if generation queued but not yet picked up',
  })
  jobId!: string | null;

  @ApiProperty({ minimum: 0, maximum: 100 })
  progress!: number;
}

export class PlanFailedDto {
  @ApiProperty({ enum: [PLAN_STATUS.FAILED], example: 'FAILED' })
  status!: typeof PLAN_STATUS.FAILED;

  @ApiProperty({ nullable: true, type: String })
  errorMessage!: string | null;

  @ApiProperty()
  canRetry!: boolean;
}

export class PlanReadyDto {
  @ApiProperty({ enum: [PLAN_STATUS.READY], example: 'READY' })
  status!: typeof PLAN_STATUS.READY;

  @ApiProperty()
  lifestylePlanId!: string;

  @ApiProperty()
  planWeekId!: string;

  @ApiProperty()
  weekIndex!: number;

  @ApiProperty()
  dayIndex!: number;

  @ApiProperty({ description: 'YYYY-MM-DD in UTC for the requested day' })
  date!: string;

  @ApiProperty()
  source!: string;

  @ApiProperty()
  schemaVersion!: string;

  @ApiProperty({
    description: 'Day plan content (workout, nutrition, habits)',
    type: 'object',
    additionalProperties: true,
  })
  day!: Record<string, unknown>;

  @ApiProperty({
    description: 'Activities the user has marked completed today',
    type: 'array',
    items: { type: 'object' },
  })
  completion!: Array<Record<string, unknown>>;
}

export type LifestyleTodayStatusDto =
  | PlanNotStartedDto
  | PlanGeneratingDto
  | PlanFailedDto
  | PlanReadyDto;
