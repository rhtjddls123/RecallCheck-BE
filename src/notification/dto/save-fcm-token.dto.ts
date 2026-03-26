import { IsIn, IsOptional, IsString } from 'class-validator';

export class SaveFcmTokenDto {
  @IsString()
  token: string;

  @IsString()
  @IsOptional()
  @IsIn(['web', 'app'])
  platform: 'web' | 'app' = 'web';
}
