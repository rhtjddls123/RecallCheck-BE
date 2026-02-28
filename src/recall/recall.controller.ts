import { Controller } from '@nestjs/common';
import { RecallService } from './recall.service';

@Controller('recall')
export class RecallController {
  constructor(private readonly recallService: RecallService) {}
}
