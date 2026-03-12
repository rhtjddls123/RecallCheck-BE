import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationSettingModel } from './entity/notification-setting.entity';
import { Repository } from 'typeorm';
import { RecallMenuModel } from 'src/recall/entity/recall-menu.entity';
import { HIDDEN_MENU_IDS, RELATED_MENU_IDS } from './const/RELATED_MENU_IDS';

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
}
