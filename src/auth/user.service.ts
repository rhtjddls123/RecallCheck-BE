import { InjectRepository } from '@nestjs/typeorm';
import { UserModel } from './entity/user.entity';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
  ) {}

  async getUserById(id: number) {
    return await this.userRepository.findOne({ where: { id } });
  }
}
