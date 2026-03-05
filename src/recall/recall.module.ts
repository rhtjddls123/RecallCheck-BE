import { Module } from '@nestjs/common';
import { RecallService } from './recall.service';
import { RecallController } from './recall.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecallModel } from './entity/recall.entity';
import { RecallMenuModel } from './entity/recall-menu.entity';
import { OpenAIService } from './openai.service';
import { EsModule } from './elasticsearch.module';

@Module({
  imports: [TypeOrmModule.forFeature([RecallModel, RecallMenuModel]), EsModule],
  controllers: [RecallController],
  providers: [RecallService, OpenAIService],
  exports: [RecallService],
})
export class RecallModule {}
