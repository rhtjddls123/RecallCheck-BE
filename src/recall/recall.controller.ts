import {
  ClassSerializerInterceptor,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RecallService } from './recall.service';
import { PaginateRecallDto } from './dto/paginate-recall.dto';
import type { RECALL_CATEGORY_KEY_TYPE } from 'src/consumer24/const/KEYS.const';
import { InjectRepository } from '@nestjs/typeorm';
import { RecallModel } from './entity/recall.entity';
import { Repository } from 'typeorm';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { RolesEnum } from 'src/auth/const/roles.const';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { OptionalJwtGuard } from 'src/auth/guard/optional-jwt.guard';
import { JwtPayload } from 'src/auth/auth.service';
import { GetUser } from 'src/auth/decorator/get-userId.decorator';

@UseInterceptors(ClassSerializerInterceptor)
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
  @UseGuards(OptionalJwtGuard)
  async getRecall(
    @Query() body: PaginateRecallDto,
    @GetUser() userId?: JwtPayload['sub'],
  ) {
    return this.recallService.findPaginateRecall(body, userId);
  }

  @Get('search')
  async getRecallWithChatbot() {
    return this.recallService.findRecentRecall(5);
  }

  @Get(':recallSn')
  @UseGuards(OptionalJwtGuard)
  async getRecallDetail(
    @Param('recallSn') recallSn: string,
    @GetUser() userId?: JwtPayload['sub'],
  ) {
    return this.recallService.findRecallDetail(recallSn, userId);
  }

  @Get('chatbot-search')
  @UseGuards(OptionalJwtGuard)
  async chatbotSearch(
    @Query('query') query: string,
    @Query('categoryId') categoryId?: RECALL_CATEGORY_KEY_TYPE,
    @Query('path') path?: string,
    @GetUser() userId?: JwtPayload['sub'],
  ) {
    return this.recallService.chatbotSearchWithLogSave(
      query,
      categoryId,
      userId,
      path,
    );
  }

  @Get('embedding-search')
  async embeddingSearch(@Query('query') query: string) {
    return this.recallService.embeddingSearch(query);
  }

  @Roles(RolesEnum.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @Get('ping')
  async ping() {
    return this.recallService.checkConnection();
  }

  @Roles(RolesEnum.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @Post('create-index') // es 인덱스 생성
  async createIndex() {
    return this.recallService.createIndex();
  }

  @Roles(RolesEnum.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @Post('sync') // es db와 동기화
  async sync() {
    return this.recallService.syncToElasticsearch();
  }

  @Roles(RolesEnum.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @Post('embed-all') // 최초 1회만 실행(db에 임베딩값 저장)
  async embedAll() {
    return this.recallService.embedAllProducts();
  }
}
