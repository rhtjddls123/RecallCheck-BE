import { IsOptional, IsString } from 'class-validator';

export class SaveFcmTokenDto {
  @IsString()
  token: string;

  @IsString()
  @IsOptional()
  platform: 'web' | 'app' = 'web';
}
