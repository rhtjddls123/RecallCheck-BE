import { IsString } from 'class-validator';

export class SaveFcmTokenDto {
  @IsString()
  token: string;
}
