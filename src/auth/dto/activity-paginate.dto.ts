import { IsIn, IsNumber, IsOptional } from 'class-validator';
import { LogTypeEnum } from '../const/log-type.const';

export class ActivityPaginateDto {
  @IsOptional()
  @IsNumber()
  cursorId?: number;

  @IsOptional()
  @IsNumber()
  take: number = 20;

  @IsIn(Object.values(LogTypeEnum))
  type: LogTypeEnum;
}
