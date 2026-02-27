import { Injectable } from '@nestjs/common';
import { Consumer24Client } from './consumer24.client';

@Injectable()
export class Consumer24Service {
  constructor(private readonly client: Consumer24Client) {}

  async saveInfoList() {
    const response = await this.client.fetchInfoList();

    return response;
  }
}
