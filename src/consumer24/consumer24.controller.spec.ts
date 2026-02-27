import { Test, TestingModule } from '@nestjs/testing';
import { Consumer24Controller } from './consumer24.controller';
import { Consumer24Service } from './consumer24.service';

describe('Consumer24Controller', () => {
  let controller: Consumer24Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Consumer24Controller],
      providers: [Consumer24Service],
    }).compile();

    controller = module.get<Consumer24Controller>(Consumer24Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
