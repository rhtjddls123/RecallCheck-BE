import { Module } from '@nestjs/common';
import { Consumer24Service } from './consumer24.service';
import { Consumer24Controller } from './consumer24.controller';
import { HttpModule } from '@nestjs/axios';
import { Consumer24Client } from './consumer24.client';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafetyInfoModel } from 'src/safety-info/entity/safetyInfo.entity';
import { Consumer24Scheduler } from './consumer24.scheduler';
import { Consumer24Mapper } from './consumer24.mapper';
import { RecallModel } from 'src/recall/entity/recall.entity';
import { RecallModule } from 'src/recall/recall.module';
import { NotificationModule } from 'src/notification/notification.module';
import { RecallNewsModel } from './entity/recall-news.entity';
import { RecallNewsCrawler } from './recall-news.crawler';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    HttpModule,
    RecallModule,
    NotificationModule,
    AuthModule,
    TypeOrmModule.forFeature([SafetyInfoModel, RecallModel, RecallNewsModel]),
  ],
  controllers: [Consumer24Controller],
  providers: [
    Consumer24Service,
    Consumer24Client,
    Consumer24Scheduler,
    Consumer24Mapper,
    RecallNewsCrawler,
  ],
})
export class Consumer24Module {}
