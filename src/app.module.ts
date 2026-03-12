import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecallModule } from './recall/recall.module';
import { Consumer24Module } from './consumer24/consumer24.module';
import { SafetyInfoModule } from './safety-info/safety-info.module';
import { OpenaiModule } from './openai/openai.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { NotificationModule } from './notification/notification.module';
import { FirebaseModule } from './notification/firebase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true, // 개발환경에서만 true 배포시 false,
    }),
    RecallModule,
    Consumer24Module,
    SafetyInfoModule,
    OpenaiModule,
    AuthModule,
    CommonModule,
    NotificationModule,
    FirebaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(DelayMiddleware).forRoutes('*');
    consumer.apply();
  }
}
