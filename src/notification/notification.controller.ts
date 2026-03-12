import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { User } from 'src/auth/decorator/user.decorator';
import { JwtGuard } from 'src/auth/guard/jwt.guard';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

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
}
