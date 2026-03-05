import { Module } from '@nestjs/common';
import { RecallService } from './recall.service';
import { RecallController } from './recall.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecallModel } from './entity/recall.entity';
import { RecallMenuModel } from './entity/recall-menu.entity';
import { EsModule } from './elasticsearch.module';
import { OpenaiModule } from 'src/openai/openai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecallModel, RecallMenuModel]),
    EsModule,
    OpenaiModule,
  ],
  controllers: [RecallController],
  providers: [RecallService],
  exports: [RecallService],
})
export class RecallModule {}
