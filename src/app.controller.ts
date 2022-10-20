import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
    private readonly configservice: ConfigService
    ) {}

  @Get()
  async login22() { 
    return this.appService.getHello();
  }
}
