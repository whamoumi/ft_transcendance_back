import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class DMService {
  constructor(private prisma: PrismaService, private userservice:UserService){}

  async create(createMessageDto: CreateMessageDto, name: string, body: any) {
    const save = await this.userservice.assignDmessages(body, name, createMessageDto.text) 
    return save;
  }
}