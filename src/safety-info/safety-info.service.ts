import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SafetyInfoModel } from './entity/safetyInfo.entity';
import { Repository } from 'typeorm';
import { PaginateSafetyInfoDto } from './dto/paginate-safety-info.dto';

@Injectable()
export class SafetyInfoService {
  constructor(
    @InjectRepository(SafetyInfoModel)
    private readonly safetyInfoRepository: Repository<SafetyInfoModel>,
  ) {}

  async findRecentSafetyInfo(take = 5) {
    return this.safetyInfoRepository.find({
      order: { updateDate: 'DESC', id: 'ASC' },
      take,
    });
  }

  async getPaginateSafetyInfo(dto: PaginateSafetyInfoDto) {
    const currentPage = dto.page ?? 1;

    const [data, total] = await this.safetyInfoRepository.findAndCount({
      skip: dto.take * (currentPage - 1),
      take: dto.take,
      order: { uploadDate: dto.order, id: 'ASC' },
    });

    return {
      data,
      total,
    };
  }
}
