import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationSettingModel } from './entity/notification-setting.entity';
import { FindOptionsWhere, LessThan, Repository } from 'typeorm';
import { RecallMenuModel } from 'src/recall/entity/recall-menu.entity';
import { RecallModel } from 'src/recall/entity/recall.entity';
import { NotificationModel } from './entity/notification.entity';
import { HIDDEN_MENU_IDS, RELATED_MENU_IDS } from './const/RELATED_MENU_IDS';
import { NotificationPaginateDto } from './dto/notificationPaginate.dto';
import { NotificationSseService } from './notification-sse.service';
import { UserModel } from 'src/auth/entity/user.entity';
import { FcmSubscriptionModel } from './entity/fcm-subscription.entity';
import { Messaging } from 'firebase-admin/messaging';
import { SetQuietTimeDto } from 'src/auth/dto/set-quiet-time.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationSseService: NotificationSseService,
    @InjectRepository(NotificationSettingModel)
    private readonly settingRepository: Repository<NotificationSettingModel>,
    @InjectRepository(NotificationModel)
    private readonly notificationRepository: Repository<NotificationModel>,
    @InjectRepository(RecallMenuModel)
    private readonly menuRepository: Repository<RecallMenuModel>,
    @InjectRepository(FcmSubscriptionModel)
    private readonly fcmRepository: Repository<FcmSubscriptionModel>,
    @Inject('FIREBASE_ADMIN')
    private readonly messaging: Messaging,
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
  ) {}

  private async validateMenu(menuId: string) {
    const menu = await this.menuRepository.findOne({ where: { id: menuId } });
    if (!menu) {
      throw new BadRequestException('유효하지 않은 카테고리입니다');
    }
    return menu;
  }

  async addSetting(userId: number, menuId: string) {
    await this.validateMenu(menuId);

    const menuIds = RELATED_MENU_IDS[menuId] ?? [menuId];

    for (const id of menuIds) {
      const existing = await this.settingRepository.findOne({
        where: { user: { id: userId }, menu: { id } },
      });

      if (existing) {
        await this.settingRepository.update(existing.id, { isActive: true });
        continue;
      }

      await this.settingRepository.save({
        user: { id: userId },
        menu: { id },
      });
    }

    return { message: '알림 설정이 추가되었습니다' };
  }

  async removeSetting(userId: number, menuId: string) {
    await this.validateMenu(menuId);

    const menuIds = RELATED_MENU_IDS[menuId] ?? [menuId];

    for (const id of menuIds) {
      const existing = await this.settingRepository.findOne({
        where: { user: { id: userId }, menu: { id }, isActive: true },
      });

      if (!existing) continue;

      await this.settingRepository.update(existing.id, { isActive: false });
    }

    return { message: '알림 설정이 비활성화되었습니다' };
  }

  async getSettings(userId: number) {
    const datas = await this.settingRepository.find({
      where: { user: { id: userId }, isActive: true },
      relations: { menu: true },
    });

    return datas.filter((data) => !HIDDEN_MENU_IDS.includes(data.menu.id));
  }

  async sendNotifications(newProducts: Partial<RecallModel>[]) {
    const sseMap = new Map<
      number,
      {
        user: UserModel;
        items: { menuName: string; product: Partial<RecallModel> }[];
      }
    >();

    for (const product of newProducts) {
      const settings = await this.settingRepository.find({
        where: { menu: { id: product.cntntsId }, isActive: true },
        relations: ['user', 'menu'],
      });

      if (settings.length === 0) continue;

      for (const setting of settings) {
        await this.notificationRepository.save(
          this.notificationRepository.create({
            user: { id: setting.user.id },
            title: `[${setting.menu.name}] 새로운 리콜 제품`,
            body: product.productNm,
            recall: { recallSn: product.recallSn },
          }),
        );

        const userId = setting.user.id;
        if (!sseMap.has(userId)) {
          sseMap.set(userId, { user: setting.user, items: [] });
        }
        sseMap.get(userId)!.items.push({
          menuName: setting.menu.name,
          product,
        });
      }
    }

    for (const { user, items } of sseMap.values()) {
      const count = items.length;
      const title = `구독하신 카테고리에 새로운 리콜 제품 ${count}건이 등록되었습니다`;
      const body = items
        .map((i) => `[${i.menuName}] ${i.product.productNm}`)
        .join(', ');

      this.notificationSseService.send(user.id, { title, body });
      await this.sendFcmPush(user.id, title, body);
    }
  }

  async getNotifications(dto: NotificationPaginateDto, userId: number) {
    const where: FindOptionsWhere<NotificationModel> = {
      user: { id: userId },
    };

    if (dto.cursorId) {
      where.id = LessThan(dto.cursorId);
    }

    const notifications = await this.notificationRepository.find({
      where,
      relations: { recall: true },
      order: { id: 'DESC' },
      take: dto.take + 1,
    });

    const hasNextPage = notifications.length > dto.take;
    const data = hasNextPage ? notifications.slice(0, dto.take) : notifications;

    const lastItem = hasNextPage ? data[data.length - 1] : null;

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    const nextUrl = lastItem && new URL(`${baseUrl}/notification`);

    if (nextUrl && hasNextPage) {
      nextUrl.searchParams.append('cursorId', String(lastItem.id));

      for (const key of Object.keys(dto) as (keyof NotificationPaginateDto)[]) {
        const value = dto[key];
        if (value === undefined || value === null) continue;
        if (key !== 'cursorId') {
          nextUrl.searchParams.append(key, value.toString());
        }
      }
    }

    return {
      data,
      count: data.length,
      cursorId: lastItem?.id ?? null,
      hasNextPage,
      next: nextUrl?.toString() ?? null,
    };
  }

  async readNotification(id: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException('알림이 존재하지 않습니다');
    }

    if (notification.isRead) {
      return { message: '이미 읽은 알림입니다' };
    }

    await this.notificationRepository.update(id, { isRead: true });
    return { message: '읽음 처리되었습니다' };
  }

  async deleteNotification(id: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException('알림이 존재하지 않습니다');
    }

    await this.notificationRepository.delete(id);
    return { message: '삭제되었습니다' };
  }

  async readAllNotifications(userId: number) {
    await this.notificationRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );
    return { message: '전체 읽음 처리되었습니다' };
  }

  async saveFcmToken(userId: number, token: string, platform: 'web' | 'app') {
    const existing = await this.fcmRepository.findOne({
      where: { fcmToken: token },
    });

    if (existing) return { message: '이미 등록되어있는 FCM 토큰입니다.' };

    await this.fcmRepository.save({
      user: { id: userId },
      fcmToken: token,
      platform,
    });

    return { message: 'FCM 토큰이 등록되었습니다' };
  }

  async deleteFcmToken(userId: number, token: string) {
    await this.fcmRepository.delete({
      user: { id: userId },
      fcmToken: token,
    });

    return { message: 'FCM 토큰이 삭제되었습니다' };
  }

  private isQuietTime(
    quietStart: string | null,
    quietEnd: string | null,
  ): boolean {
    if (!quietStart || !quietEnd) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = quietStart.split(':').map(Number);
    const [endHour, endMin] = quietEnd.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  private async sendFcmPush(userId: number, title: string, body: string) {
    const subscriptions = await this.fcmRepository.find({
      where: { user: { id: userId } },
      relations: { user: true },
    });

    if (subscriptions.length === 0) return;

    const user = subscriptions[0].user;

    if (this.isQuietTime(user.quietStart, user.quietEnd)) return;

    const webSubs = subscriptions.filter((sub) => sub.platform === 'web');
    const appSubs = subscriptions.filter((sub) => sub.platform === 'app');

    if (webSubs.length > 0) {
      const messages = webSubs.map((sub) => ({
        token: sub.fcmToken,
        notification: { title, body },
        webpush: {
          notification: {
            title,
            body,
            icon: '/icon.png',
          },
        },
      }));
      await this.messaging.sendEach(messages);
    }

    if (appSubs.length > 0) {
      const messages = appSubs.map((sub) => ({
        to: sub.fcmToken,
        title,
        body,
        sound: 'default',
      }));

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
    }
  }

  async checkFcmToken(userId: number, token: string) {
    const exists = await this.fcmRepository.exists({
      where: {
        user: { id: userId },
        fcmToken: token,
      },
    });
    return { exists };
  }

  async setQuietTime(userId: number, dto: SetQuietTimeDto) {
    await this.userRepository.update(userId, {
      quietStart: dto.quietStart,
      quietEnd: dto.quietEnd,
    });
    return { message: '방해금지 시간이 설정되었습니다' };
  }

  async getQuietTime(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, quietStart: true, quietEnd: true },
    });

    if (!user) throw new NotFoundException('유저 정보를 찾을 수 없습니다.');

    return { quietStart: user.quietStart, quietEnd: user.quietEnd };
  }
}
