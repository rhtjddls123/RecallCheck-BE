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

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([SafetyInfoModel, RecallModel]),
  ],
  controllers: [Consumer24Controller],
  providers: [
    Consumer24Service,
    Consumer24Client,
    Consumer24Scheduler,
    Consumer24Mapper,
  ],
})
export class Consumer24Module {}
