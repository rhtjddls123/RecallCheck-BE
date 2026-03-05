import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RecallService } from './recall.service';
import { PaginateRecallDto } from './dto/paginate-recall.dto';
import type { RECALL_CATEGORY_KEY_TYPE } from 'src/consumer24/const/KEYS.const';
import { InjectRepository } from '@nestjs/typeorm';
import { RecallModel } from './entity/recall.entity';
import { Repository } from 'typeorm';

@Controller('recall')
export class RecallController {
  constructor(
    private readonly recallService: RecallService,
    @InjectRepository(RecallModel)
    private readonly recallRepository: Repository<RecallModel>,
  ) {}

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

  @Get('search')
  async getRecallWithChatbot() {
    return this.recallService.findRecentRecall(5);
  }

  @Get('correct-typo')
  async getCorrectTypo(@Query('query') query: string) {
    return this.recallService.correctQuery(query);
  }

  @Get('chatbot-search')
  async chatbotSearch(
    @Query('query') query: string,
    @Query('categoryId') categoryId?: RECALL_CATEGORY_KEY_TYPE,
  ) {
    return this.recallService.chatbotSearch(query, categoryId);
  }

  @Get('embedding-search')
  async embeddingSearch(@Query('query') query: string) {
    return this.recallService.embeddingSearch(query);
  }

  @Get('ping')
  async ping() {
    return this.recallService.checkConnection();
  }

  @Post('create-index') // es 인덱스 생성
  async createIndex() {
    return this.recallService.createIndex();
  }

  @Post('sync') // es db와 동기화
  async sync() {
    return this.recallService.syncToElasticsearch();
  }

  @Post('embed-all') // 최초 1회만 실행(db에 임베딩값 저장)
  async embedAll() {
    return this.recallService.embedAllProducts();
  }
}
