import { Controller, Get, Query } from '@nestjs/common';
import { OpenAIService } from './openai.service';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenAIService) {}

  @Get('correct-typo')
  async getCorrectTypo(@Query('query') query: string) {
    return this.openaiService.correctTypo(query);
  }
}
