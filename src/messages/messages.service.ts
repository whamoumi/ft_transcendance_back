import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService, private userservice:UserService){}
  clientToUser = {};

  async identify(body: any, name: string, clientId: string, room: string) {
    this.clientToUser[clientId] = name;
    const save = await this.userservice.assignchannel(body, clientId);

    return Object.values(this.clientToUser);
  }

  getClientName(clientId: string){
    return this.clientToUser[clientId];
  }

  async create(createMessageDto: CreateMessageDto, name: string, body: any) {
    const save = await this.userservice.assignmessage(body, name, createMessageDto.text) 
    return save
  }

  async createDM(createMessageDto: CreateMessageDto, name: string, body: any) {
    const save = await this.userservice.assignDmessages(body, name, createMessageDto.text) 
    return save;
  }

  async roomSend(id: number) {
    const save = await this.userservice.getUserChannel(id)
    const item = save[0].channels.map(item => item.joined).indexOf(true)
    return save[0].channels[item].name
  }

  async findAll(body: any) {
    const save = await this.userservice.getUserChannel(body.userId)
    const MSG = await this.userservice.getAllMessagesByChannelId(save[0].channels[0].channelsId)
    return MSG;
  }
}