import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationSettingModel } from './entity/notification-setting.entity';
import { Repository } from 'typeorm';
import { RecallMenuModel } from 'src/recall/entity/recall-menu.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationSettingModel)
    private readonly settingRepository: Repository<NotificationSettingModel>,
    @InjectRepository(RecallMenuModel)
    private readonly menuRepository: Repository<RecallMenuModel>,
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

    const existing = await this.settingRepository.findOne({
      where: { user: { id: userId }, menu: { id: menuId } },
    });

    if (existing) {
      await this.settingRepository.update(existing.id, {
        isActive: true,
      });
      return { message: '알림 설정이 활성화되었습니다' };
    }

    await this.settingRepository.save({
      user: { id: userId },
      menu: { id: menuId },
    });
    return { message: '알림 설정이 추가되었습니다' };
  }

  async removeSetting(userId: number, menuId: string) {
    await this.validateMenu(menuId);

    const existing = await this.settingRepository.findOne({
      where: { user: { id: userId }, menu: { id: menuId }, isActive: true },
    });

    if (!existing) {
      throw new NotFoundException('해당 알림 설정이 존재하지 않습니다');
    }

    await this.settingRepository.update(existing.id, { isActive: false });
    return { message: '알림 설정이 비활성화되었습니다' };
  }

  async getSettings(userId: number) {
    return this.settingRepository.find({
      where: { user: { id: userId }, isActive: true },
      relations: { menu: true },
    });
  }
}
