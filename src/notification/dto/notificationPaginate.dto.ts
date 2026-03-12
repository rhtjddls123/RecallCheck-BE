import { IsNumber, IsOptional } from 'class-validator';

export class NotificationPaginateDto {
  @IsOptional()
  @IsNumber()
  cursorId?: number;

  @IsOptional()
  @IsNumber()
  take: number = 10;
}
