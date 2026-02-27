import { Controller } from '@nestjs/common';
import { Consumer24Service } from './consumer24.service';

@Controller('consumer24')
export class Consumer24Controller {
  constructor(private readonly consumer24Service: Consumer24Service) {}
}
