import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RecallModel } from './entity/recall.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RecallService {
  constructor(
    @InjectRepository(RecallModel)
    private readonly recallRepository: Repository<RecallModel>,
  ) {}

  async findRecentRecall(take = 5) {
    return this.recallRepository.find({
      order: { recallSn: 'DESC' },
      take,
    });
  }
}
