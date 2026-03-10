import { InjectRepository } from '@nestjs/typeorm';
import { UserModel } from './entity/user.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, LessThan, Repository } from 'typeorm';
import { LogTypeEnum } from './const/log-type.const';
import { UserLogModel } from './entity/user-log.entity';
import { ActivityPaginateDto } from './dto/activity-paginate.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
    @InjectRepository(UserLogModel)
    private readonly userLogRepository: Repository<UserLogModel>,
  ) {}

  async getUserById(id: number) {
    return await this.userRepository.findOne({ where: { id } });
  }

  async addUserLog(
    user: UserModel,
    type: LogTypeEnum,
    data?: Partial<UserLogModel>,
  ) {
    await this.userLogRepository.save({ user, type, ...data });
  }

  async deleteUserLog(logId: number) {
    const log = await this.userLogRepository.findOne({ where: { id: logId } });

    if (!log) {
      throw new NotFoundException('로그를 찾을 수 없습니다.');
    }
    return await this.userLogRepository.remove(log);
  }

  async isLogMine(userId: number, logId: number) {
    return this.userLogRepository.exists({
      where: { id: logId, user: { id: userId } },
      relations: { user: true },
    });
  }

  async cursorPaginateActivity(dto: ActivityPaginateDto, userId: number) {
    const where: FindOptionsWhere<UserLogModel> = {
      type: dto.type,
      user: { id: userId },
    };

    if (dto.cursorId) {
      where.id = LessThan(dto.cursorId);
    }

    const posts = await this.userLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: dto.take + 1, // 다음 요소가 있는지 확인하기 위해 입력받은 take보다 1을 더해줌
    });

    const hasNextPage = posts.length > dto.take;
    const data = hasNextPage ? posts.slice(0, dto.take) : posts;

    const lastItem = hasNextPage ? data[data.length - 1] : null;

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    const nextUrl = lastItem && new URL(`${baseUrl}/activity`);

    if (nextUrl && hasNextPage) {
      nextUrl.searchParams.append('type', dto.type);
      nextUrl.searchParams.append('cursorId', String(lastItem.id));

      for (const key of Object.keys(dto) as (keyof ActivityPaginateDto)[]) {
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
}
