import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { RecallService } from './recall.service';
import { PaginateRecallDto } from './dto/paginate-recall.dto';

@Controller('recall')
export class RecallController {
  constructor(private readonly recallService: RecallService) {}

  @Get('recent')
  async getRecentRecall(
    @Query('take', new DefaultValuePipe(5), ParseIntPipe) take: number,
  ) {
    return this.recallService.findRecentRecall(take);
  }

  @Get()
  async getRecall(@Query() body: PaginateRecallDto) {
    return this.recallService.findPaginateRecall(body);
  }
}
