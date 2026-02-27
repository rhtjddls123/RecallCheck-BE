import { Module } from '@nestjs/common';
import { SafetyInfoService } from './safety-info.service';
import { SafetyInfoController } from './safety-info.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafetyInfoModel } from './entity/safetyInfo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SafetyInfoModel])],
  controllers: [SafetyInfoController],
  providers: [SafetyInfoService],
})
export class SafetyInfoModule {}
