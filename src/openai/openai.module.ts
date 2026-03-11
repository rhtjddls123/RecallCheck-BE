import { Module } from '@nestjs/common';
import { OpenaiController } from './openai.controller';
import { OpenAIService } from './openai.service';
import { CommonModule } from 'src/common/common.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [OpenaiController],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenaiModule {}
