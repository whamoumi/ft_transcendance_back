import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket  } from 'socket.io';
import { Body, Res } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService, private userservice:UserService) {}

  @SubscribeMessage('connection')
  async connection(@MessageBody() createMessageDto: CreateMessageDto, @ConnectedSocket() client: Socket, @Body() body) {
    console.log('CONNECTION ==> ', body)
    this.server.on('connection', (client) => {
      console.log('User connected');
      client.on('disconnect', async() =>{
      console.log('User disconnect');
      const status = await this.userservice.updateStatus(body.userId, 'offline')
    });    
    });
    const status = await this.userservice.updateStatus(body.userId, 'online')
    const socket = await this.userservice.updateSocketIdInUserTable(body, client.id)
    return 200
  }

  @SubscribeMessage('disconnection')
  async disconnection(@MessageBody() createMessageDto: CreateMessageDto, @ConnectedSocket() client: Socket, @Body() body) {
    console.log('<== DISCONNECTION ==> ')
    const status = await this.userservice.updateStatus(body.userId, 'offline')
    return 200
  }

  @SubscribeMessage('invite')
  async invite(@MessageBody() createMessageDto: CreateMessageDto, @ConnectedSocket() client: Socket, @Body() body) {
    const user = await this.userservice.getUserByNameJson(body.name)
    //this.server.send('invite', user);
    client.broadcast.emit('invite', {user, roomId: body.roomId})
    return user
  }

  @SubscribeMessage('mute')
  async mute(@MessageBody() createMessageDto: CreateMessageDto, @ConnectedSocket() client: Socket, @Body() body) {
    let update;
    const save = await this.userservice.getUserByNameJson(body.username)
    const owner = await this.userservice.isOwnerUserChannel(save, body.room)
    if (!owner.owner)
    {
      update = await this.userservice.updateUserMute(body)
    }
    if (update)
      return '200'
    return '401'
  }

  @SubscribeMessage('kick')
  async kick(@MessageBody() createMessageDto: CreateMessageDto, @ConnectedSocket() client: Socket, @Body() body) {
    let update;
    const save = await this.userservice.getUserByNameJson(body.username)
    const owner = await this.userservice.isOwnerUserChannel(save, body.room)
    if (!owner.owner)
    {
      update = await this.userservice.updateUserKick(body, true)
      if (update != undefined)
      {
        const ola = await this.userservice.getUserChannel(save)
        const item = ola[0].channels.map(item => item.joined).indexOf(true)
        this.server.to(ola[0].channels[item].socketId).emit('kick');
        await this.userservice.updateUserJoined(save, false, body.room)
        return 'suce'
      }
    }
    if (update)
      return '200'
    return '401'
  }


  @SubscribeMessage('ban')
  async ban(@MessageBody() createMessageDto: CreateMessageDto, @ConnectedSocket() client: Socket, @Body() body, @Res() res) {
    let update;
    const save = await this.userservice.getUserByNameJson(body.username)
    const owner = await this.userservice.isOwnerUserChannel(save, body.room)
    if (!owner.owner)
    {
      update = await this.userservice.updateUserBan(body)
      if (update != undefined)
      {
        const socket = await this.userservice.getRightsByUserChannel(update.save)
        this.server.to(socket.channels[0].socketId).emit('ban');
        await this.userservice.updateUserJoined(update.save, false, body.room)
        return 'suce'
      }
    }
    else
      return '401';
  }

  @SubscribeMessage('createMessage')
  async create(@MessageBody() createMessageDto: CreateMessageDto, @ConnectedSocket() client: Socket, @Body() body) {
    let save = await this.userservice.findOne(body.userId)
    if (save)
    {
      const rights = await this.userservice.getRightsByUserChannel(save.id);
      const time = Date.now() / 1000;
      if (!rights.channels[0].timeofmute || time > (rights.channels[0].timeofmute + rights.channels[0].durationofmute))
      {
        const mute = await this.userservice.deleteUserMute(save.id)
        const message = await this.messagesService.create(createMessageDto, save.username, body);
        this.server.to(await this.messagesService.roomSend(save.id)).emit('message', message);
        return '200';
      }
      return '401';
    }
    return ;
  }

  @SubscribeMessage('findAllSocket')
  async findAllSocket(@Body() body,
  @ConnectedSocket() client: Socket) {
    const socket = await this.userservice.updateSocketIdInUserTable(body, client.id)
    const status = await this.userservice.updateStatus(body.userId, 'online')
    return socket
  }

  @SubscribeMessage('findAllMessages')
  async findAll(@Body() body,
  @ConnectedSocket() client: Socket) {
    // update socketId au refresh
    const save = await this.userservice.getUserChannel(body.userId)
    const item = save[0].channels.map(item => item.joined).indexOf(true)
    const rights = await this.userservice.getRightsByUserChannel(body.userId)
    if (item >= 0)
    {
      if (save[0].channels[item].name)
      {
        //const save = await this.userservice.getUserChannel(body.userId)
        const channel = await this.userservice.getChannelsById(body.currentIdChannel)
       // const rights = await this.userservice.getUserChannel(body.userId)
        client.join(channel[0].name);
        const MSG = await this.userservice.getAllMessagesByChannelId(channel[0].id)
        await this.userservice.updateUserJoined(body.userId, true, channel[0].name)
        const rights = await this.userservice.getRightsByUserChannel(body.userId)
        const item = rights.channels.map(item => item.joined).indexOf(true)
        const socket = await this.userservice.updateSocketId(body, client.id)
        const blocked = await this.userservice.getAllBlockedByUser(body.userId)
        return {
              msg: MSG,
              owner: rights.channels[item].owner,
              admin: rights.channels[item].admin,
              mute: rights.channels[item].mute,
              ban: rights.channels[item].ban,
              joined: rights.channels[item].joined,
              blocked: blocked
          }
      }
    }
    else
    {
      return '401'
    }
  }

 /* @SubscribeMessage('findAllMessages')
  async findAll(@Body() body,
  @ConnectedSocket() client: Socket) {
    // update socketId au refresh
    console.log('FIND ALL => ', body)
    const save = await this.userservice.getUserChannel(body.userId)
    const item = save[0].channels.map(item => item.joined).indexOf(true)
    const rights = await this.userservice.getRightsByUserChannel(body.userId)
    if (save[0].channels[0] != undefined && rights.channels[0].joined)
    {
      if (save[0].channels[0].name)
      {
        const save = await this.userservice.getUserChannel(body.userId)
        const channel = await this.userservice.getChannelsById(body.currentIdChannel)
       // const rights = await this.userservice.getUserChannel(body.userId)
        console.log('CHANNEL ',channel[0].name)
        client.join(channel[0].name);
        const MSG = await this.userservice.getAllMessagesByChannelId(channel[0].id)
        await this.userservice.updateUserJoined(body.userId, true, channel[0].name)
        const rights = await this.userservice.getRightsByUserChannel(body.userId)
        const socket = await this.userservice.updateSocketId(body, client.id)
        return {
              msg: MSG,
              owner: rights.channels[0].owner,
              admin: rights.channels[0].admin,
              mute: rights.channels[0].mute,
              ban: rights.channels[0].ban,
              joined: rights.channels[0].joined
          }
      }
    }
    else
    {
      return '401'
    }
  }*/
  
  @SubscribeMessage('join')
  async joinChannel(
  //@MessageBody('name') name: string,
  @ConnectedSocket() client: Socket,
  @Body() room) 
  {
    const save = await this.userservice.assignchannel(room, client);
    const rights = await this.userservice.getRightsByUserChannel(room.userId);
    const time = Date.now() / 1000;
    const id = client.id;
    const item = rights.channels.map(item => item.name).indexOf(room.room)
    if (!rights.channels[item].ban || time > (rights.channels[item].timeofban + rights.channels[item].durationofban))
    {
      if (room.room == rights.channels[item].name)
      {
        client.join(room.room);
        await this.userservice.updateUserJoined(room.userId, true, room.room)
        const kick = await this.userservice.updateUserKickId(room, false)
        //const update = await this.userservice.updateUserKick2(room, false)

      }
     // await this.userservice.updateSocketId(room, client)
      // mettre a false dans la DB
    }
    else if (rights.channels[item].ban)
    {
      if (room.room != rights.channels[item].name)
      {
        client.join(room.room)
        await this.userservice.updateUserJoined(room.userId, true, room.room)
        const kick = await this.userservice.updateUserKickId(room, false)
        //const update = await this.userservice.updateUserKick2(room, false)

      }
      //this.userservice.deletechannel(room)
      else
        return '401'
    }
    const up = await this.userservice.updateSocketId(room, id)
    //const save = await this.userservice.assignchannel(room);
    const DB = await this.userservice.getChannelsByName(room.room);
    if (DB.password)
    {
      const check = await bcrypt.compare(room.password, DB.password);
      if (check)
      {
        if (!rights.channels[item].ban || time > (rights.channels[item].timeofban + rights.channels[item].durationofban))
        {
          if (room.room == rights.channels[item].name)
          {
            client.join(room.room);
            const kick = await this.userservice.updateUserKickId(room, false)
            await this.userservice.updateUserJoined(room.userId, true, room.room)
            //const update = await this.userservice.updateUserKick(room, true)
            const owner = await this.userservice.isOwner(room)
            if (owner.owner[0].userId === room.userId)
            {
              await this.userservice.updateUserOwner(room.userId, room.room)
            }
            this.messagesService.identify(room, room.name, client.id, room.room);
            const MSG = await this.userservice.getAllMessagesByChannelId(room.idRoom)
            const rights = await this.userservice.getRightsByUserChannel(room.userId)
            const blocked = await this.userservice.getAllBlockedByUser(room.userId)
            if (MSG)
              return { 
                  msg: MSG,
                  owner: rights.channels[item].owner,
                  admin: rights.channels[item].admin,
                  mute: rights.channels[item].mute,
                  ban: rights.channels[item].ban,
                  blocked: blocked
                }
          }
        }
        else if (rights.channels[item].ban)
        {
          if (room.room != rights.channels[item].name)
          {
            client.join(room.room)
            await this.userservice.updateUserJoined(room.userId, true, room.room)
            const kick = await this.userservice.updateUserKickId(room, false)
          }
          else
            return '401'
        }
      }
      else
        this.userservice.deletechannel(room)
    }
    else
    {
      client.join(room.room)
      const kick = await this.userservice.updateUserKickId(room, false)
      await this.userservice.updateUserJoined(room.userId, true, room.room)
      //const update = await this.userservice.updateUserKick2(room, false)
      const owner = await this.userservice.isOwner(room)
      if (owner.owner[0].userId === room.userId)
        await this.userservice.updateUserOwner(room.userId, room.room)
      this.messagesService.identify(room, room.name, client.id, room.room);
      const MSG = await this.userservice.getAllMessagesByChannelId(room.idRoom)
      const rights = await this.userservice.getRightsByUserChannel(room.userId)
      const item = rights.channels.map(item => item.joined).indexOf(true)
      const blocked = await this.userservice.getAllBlockedByUser(room.userId)
      if (MSG)
        return { 
                  msg: MSG,
                  owner: rights.channels[item].owner,
                  admin: rights.channels[item].admin,
                  mute: rights.channels[item].mute,
                  ban: rights.channels[item].ban,
                  blocked: blocked
                }
    }
  }

  @SubscribeMessage('leave')
  async leaving(@Body ()room,
  @ConnectedSocket() client: Socket) {
    client.leave(room.room)
    await this.userservice.updateUserJoined(room.userId, false, room.room)
    //this.userservice.deletechannel(room)
    return room.room
  }

@SubscribeMessage('blocked')
  async blocked(@MessageBody() createMessageDto: CreateMessageDto, @ConnectedSocket() client: Socket, @Body() body) {
   // const update = await this.userservice.addUserToBlockedTable(body)
    //if (update)
      return '200'
    //return '401'
  }

  @SubscribeMessage('createDm')
  async createDM(@MessageBody() createMessageDto: CreateMessageDto, @ConnectedSocket() client: Socket, @Body() body) {
    console.log('CREATE DM ==> ', body)
    let save = await this.userservice.findOne(+body.userId)
    const is = await this.userservice.getUserByNameJson(body.name)
    const blocked = await this.userservice.getAllBlockedByUser(is)
    const item = blocked.map(item => item.idUser).indexOf(body.userId)
    if (save && item < 0)
    {
      const message = await this.messagesService.createDM(createMessageDto, save.username, body);
      if (body.idDm)
      {
        console.log('DEDANS')
        let st = JSON.stringify(body.idDm);
        console.log('BODY NAME ====> ', body.name)
        this.server.to(st).emit('message', message);
        return '200';
      }
    }
    return '401';
  }

  @SubscribeMessage('findAllDm')
  async findAllDM(@Body() body,
  @ConnectedSocket() client: Socket) {
    const save = await this.userservice.getUserDm(body.userId)
    if (save[0].DM[0] != undefined)
    {
      if (save[0].DM[0].name && save[0].DM[0].joined)
      {
        console.log('LALALALALA ====')
        console.log('LALALALALA ====', save[0].DM[0].name)
        client.join(save[0].DM[0].name);
        const MSG = await this.userservice.getAllMessagesByDm(save[0].DM[0].dmId)
        return {
                msg: MSG,
                joined: save[0].DM[0].joined
        }
      }
      else
      {
        return '401'
      }
    }
    else
      return '401'
  }
  
  @SubscribeMessage('joinDm')
  async joinDM(
  @ConnectedSocket() client: Socket,
  @Body() dm) 
  {
    let st;
    //const save = await this.userservice.assignDmAtJoin(dm);
    if (dm.idRoom)
    {
      st = JSON.stringify(dm.idRoom);
    }
    const is = await this.userservice.getUserByNameJson(dm.room)
    const blocked = await this.userservice.getAllBlockedByUser(is)
    const item = blocked.map(item => item.idUser).indexOf(dm.userId)
    if (item < 0)
      client.join(st);
    const DM = await this.userservice.getUserDm(dm.userId)
   // const item = DM[0].DM.map(item => item.name).indexOf(dm.room)
    //if (item < 0)
   // {
      const save = await this.userservice.updateUserDm(dm);
   // }
    const MSG = await this.userservice.getAllMessagesByDm(dm.idRoom)
    if (MSG)
      return MSG
    else
      return '401'
  }

  @SubscribeMessage('leaveDm')
  async leavingDM(@Body ()room,
  @ConnectedSocket() client: Socket) {
    client.leave(room.room)
    //await this.userservice.deleteDm(room)
    //await this.userservice.deleteDmTable(room)
    await this.userservice.updateUserDmJoined(room.userId, false, room.room)
    return room.room
}}
