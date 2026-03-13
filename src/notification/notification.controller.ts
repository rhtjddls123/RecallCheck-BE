import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Sse,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { User } from 'src/auth/decorator/user.decorator';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { NotificationPaginateDto } from './dto/notificationPaginate.dto';
import { NotificationSseService } from './notification-sse.service';
import { SaveFcmTokenDto } from './dto/save-fcm-token.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationSseService: NotificationSseService,
  ) {}

  @UseGuards(JwtGuard)
  @Post('setting/:menuId')
  addSetting(@Param('menuId') menuId: string, @User('sub') userId: number) {
    return this.notificationService.addSetting(userId, menuId);
  }

  @UseGuards(JwtGuard)
  @Delete('setting/:menuId')
  removeSetting(@Param('menuId') menuId: string, @User('sub') userId: number) {
    return this.notificationService.removeSetting(userId, menuId);
  }

  @UseGuards(JwtGuard)
  @Get('setting')
  getSettings(@User('sub') userId: number) {
    return this.notificationService.getSettings(userId);
  }

  @UseGuards(JwtGuard)
  @Get()
  getNotifications(
    @Query() body: NotificationPaginateDto,
    @User('sub') userId: number,
  ) {
    return this.notificationService.getNotifications(body, userId);
  }

  @UseGuards(JwtGuard)
  @Patch(':id/read')
  readNotification(@Param('id') id: number, @User('sub') userId: number) {
    return this.notificationService.readNotification(id, userId);
  }

  @UseGuards(JwtGuard)
  @Patch('read-all')
  readAllNotifications(@User('sub') userId: number) {
    return this.notificationService.readAllNotifications(userId);
  }

  @UseGuards(JwtGuard)
  @Get('stream')
  @Sse()
  stream(@User('sub') userId: number) {
    const subject = this.notificationSseService.connect(userId);

    subject.subscribe({
      complete: () => this.notificationSseService.disconnect(userId),
    });

    return subject.asObservable();
  }

  @UseGuards(JwtGuard)
  @Post('fcm-token')
  saveFcmToken(@User('sub') userId: number, @Body() dto: SaveFcmTokenDto) {
    return this.notificationService.saveFcmToken(userId, dto.token);
  }

  @UseGuards(JwtGuard)
  @Delete('fcm-token')
  deleteFcmToken(@User('sub') userId: number, @Body() dto: SaveFcmTokenDto) {
    return this.notificationService.deleteFcmToken(userId, dto.token);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  deleteNotification(@Param('id') id: number, @User('sub') userId: number) {
    return this.notificationService.deleteNotification(id, userId);
  }

  @UseGuards(JwtGuard)
  @Get('fcm-token/check')
  checkFcmToken(@User('sub') userId: number, @Query('token') token: string) {
    return this.notificationService.checkFcmToken(userId, token);
  }
}
