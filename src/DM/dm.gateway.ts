import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket  } from 'socket.io';
import { Body, Res } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { DMService } from './dm.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class DMGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: DMService, private userservice:UserService) {}

  @SubscribeMessage('blocked')
  async mute(@MessageBody() createMessageDto: CreateMessageDto, @ConnectedSocket() client: Socket, @Body() body) {
   // const update = await this.userservice.addUserToBlockedTable(body)
    //if (update)
      return '200'
    //return '401'
  }

  @SubscribeMessage('createDm')
  async create(@MessageBody() createMessageDto: CreateMessageDto, @ConnectedSocket() client: Socket, @Body() body) {
    let save = await this.userservice.findOne(body.userId)
    if (save)
    {
      const message = await this.messagesService.create(createMessageDto, save.username, body);
      this.server.to(body.dmName).emit('message', message);
      return '200';
    }
    return '401';
  }

  @SubscribeMessage('findAllDm')
  async findAll(@Body() body,
  @ConnectedSocket() client: Socket) {
    const save = await this.userservice.getUserDm(body.userId)
    if (save[0].DM[0].name != undefined)
    {
      const MSG = await this.userservice.getAllMessagesByDm(save[0].DM[0].dmId)
      return {msg: MSG,
              dm : true}
    }
    else
      return '401'
  }
  
  @SubscribeMessage('joinDm')
  async joinChannel(
  @ConnectedSocket() client: Socket,
  @Body() dm) 
  {
    client.join(dm.name);
    const MSG = await this.userservice.getAllMessagesByDm(dm.idDm)
    if (MSG)
      return MSG
    else
      return '401'
  }

  @SubscribeMessage('leaveDm')
  async leaving(@Body ()room,
  @ConnectedSocket() client: Socket) {
    client.leave(room.room)
    this.userservice.deleteDm(room)
    return room.room
  }
}
