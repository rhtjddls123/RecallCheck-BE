import { InjectRepository } from '@nestjs/typeorm';
import { UserModel } from './entity/user.entity';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LogTypeEnum } from './const/log-type.const';
import { UserLogModel } from './entity/user-log.entity';

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
}
