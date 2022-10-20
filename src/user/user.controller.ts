import { Body, Controller, Delete, Get, Header, Headers, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors, StreamableFile, UsePipes, ValidationPipe} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDetails } from 'src/utils/types';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserEntity } from './entities/user.entity';
import { diskStorage } from 'multer';
import { imageFilter } from '../utils/file_helper';
import { editFileName } from '../utils/file_helper';
import { AuthGuard } from '@nestjs/passport';
import { crossOriginEmbedderPolicy } from 'helmet';
import * as bcrypt from 'bcrypt';
import { IsNotEmpty, IsNumber, IsNumberString, isString, IsString } from "class-validator";
import { AuthService } from '../auth/auth.service';

export class SearchParams {
    @IsString()
    @IsNotEmpty()
    id: string;
}

@Controller('users')
//@UseGuards(AuthGuard('jwt'))
export class UserController {
    constructor(private userservice:UserService, private authservice: AuthService) {}

    @UseGuards(AuthGuard('jwt'))
    //@UsePipes(ValidationPipe)
    @Get('/profile/:name')
    async getUserProfileFromChannel(@Param() id: SearchParams) { 
      const user = await this.userservice.getUserByName(id)
      if (user)
      {
        const infos = await this.userservice.getUser(user)
        const matchs = await this.userservice.getMatchsByUser(user);
        let i = matchs.length
        let j = 0;
        while (j < i)
        {
            const pic1 = await this.userservice.getUserPicture(matchs[j].AdverId)
            const name = await this.userservice.findOne(matchs[j].AdverId)
            matchs[j].AdverPicture = pic1.picture
            matchs[j].Advername = name.username
            j++;
        }
        return {
            username: infos.username,
            picture: infos.picture,
            matchs: matchs
          };
      }
      else  
        return 401
    } 

    @UseGuards(AuthGuard('jwt'))
    @Get('channel/secret')
    async getSecretChannel(){//@Body() body) {
      const all = await this.userservice.getSecretChannels();
      return all;
    } 

    @UseGuards(AuthGuard('jwt'))
    @Get('channel')
    async getChannel(){//@Body() body) {
      const all = await this.userservice.getAllChannels();
      return all;
    } 

    @UseGuards(AuthGuard('jwt'))
    @UsePipes(ValidationPipe)
    @Get('dm/:id')
    async getDm(@Param() id: SearchParams) {
      const all = await this.userservice.getAllDmByUser(id)
      return all;
    } 

    //@UseGuards(AuthGuard('jwt'))
    @UseGuards(AuthGuard('jwt'))
    @UsePipes(ValidationPipe)
    @Get('stream/:id')
    async getUsername(@Param() body: SearchParams) {
      const user1 = await this.userservice.findOne(+body.id)
      //const user2 = await this.userservice.findOne(body.userId2.id)
      return user1.username
    } 

    @UseGuards(AuthGuard('jwt'))
    @UsePipes(ValidationPipe)
    @Get('status/:id')
    async getUserInGame(@Param() body: SearchParams) {
      const user1 = await this.userservice.findOne(+body.id)
      //const user2 = await this.userservice.findOne(body.userId2.id)
      const status = await this.userservice.updateStatus(+body.id, 'ingame')
      return user1.username
    } 

    //@UseGuards(AuthGuard('jwt'))
    @UseGuards(AuthGuard('jwt'))
    @Post('matchs')
    async addMatchs(@Body() body) {
      const match = await this.userservice.createMatch(body);
      const pic1 = await this.userservice.getUserPicture(body[0].userId)
      const pic2 = await this.userservice.getUserPicture(body[1].userId)
      const assign = await this.userservice.assignMatchs(body[0].userId, body[2].Roomid, body[1].userId, body[0].score, body[1].score, pic2.picture, body[1].userId);
      const assign2 = await this.userservice.assignMatchs(body[1].userId, body[2].Roomid, body[0].userId, body[1].score, body[0].score, pic1.picture, body[0].userId);
      const exp = await this.userservice.updateUserExp(body);
      const win = await this.userservice.updateUserVictory(body);
      const lose = await this.userservice.updateUserLose(body);
      const status = await this.userservice.updateStatus(body.userId, 'online')
      /*if (body.block)
      {
        const block = await this.userservice.assignBlocked(body)
      }
      else
      {
        const block = await this.userservice.deleteblocked(body)
      }*/
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('profile/blocked')
    async updateblockedUser(@Body() body) {
      const user = await this.userservice.getUserByNameJson(body.username)
      const blocked = await this.userservice.getAllBlockedByUser(body.userId)
      const item = blocked.map(item => item.idUser).indexOf(user)
      if (body.block && item < 0 && body.userId != user)
      {
        const block = await this.userservice.assignBlocked(body)
      }
      else
      {
        const block = await this.userservice.deleteblocked(body)
      }
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('profile/friends')
    async updateUserFriends(@Body() body) {
        console.log('Friend BODY=>', body)
      const user = await this.userservice.getUserByNameJson(body.username)
      const friends = await this.userservice.getAllFriendsByUser(body.userId)
      const item = friends.map(item => item.idUser).indexOf(user)
      if (body.friend && item < 0 && body.userId != user)
      {
        const block = await this.userservice.assignFriends(body)
      }
      else
      {
        const block = await this.userservice.deleteFriends(body)
      }
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('channel')
    async createChannel(@Body() body, @Res() res, @Headers() head) {
      const channel = await this.userservice.createchannel(body);
      const ownerTable = await this.userservice.assignOwner(body);
      if (channel)
        res.sendStatus(200)
      else
        res.sendStatus(401)
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('channel/update')
    async updateChannel(@Body() body, @Res() res) {
      const user = await this.userservice.getRightsByUserChannel(body.userId)
      if (user.channels[0].admin == true || user.channels[0].owner == true)
      {
        if (body.password)
        {
          const salt = await bcrypt.genSalt();
          const password = body.password;
          const hash = await bcrypt.hash(password, salt);
          const update = await this.userservice.updateChannelMdpAndType(body, hash);
        }
        else
        {
          const update = await this.userservice.updateChannelMdpAndType(body, null);
        }
          res.sendStatus(200)
      }
      else
        res.sendStatus(401)
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('channel/invite')
    async updateChannelinvite(@Body() body, @Res() res) {
      const user = await this.userservice.getUserByNameJson(body.name)
      const rights = await this.userservice.getRightsByUserChannel(body.userId)
      if (user)
      { 
        if (rights.channels[0].admin == true || rights.channels[0].owner == true)
        {
          const assign = await this.userservice.assignInvite(body, user)
          res.sendStatus(200)
        }
      }
      else
        res.sendStatus(401)
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('channel/set')
    async updateRights(@Body() body, @Res() res) {
      const user = await this.userservice.getUserByNameJson(body.usernameAdmin)
      const admin = await this.userservice.getRightsByUserChannel(user)
      const item = admin.channels.map(item => item.joined).indexOf(true)
      if (admin.channels[item].admin == true)
      {
        await this.userservice.deleteUserRights(user)
        await this.userservice.deleteFromAdminTable(user)
      }
      else
      {
        await this.userservice.updateUserRights(user)
        const ad = await this.userservice.isAdmin(body, user)
        if (!ad)
          await this.userservice.assignAdmin(body, user)
      }
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('dm')
    async createDm(@Body() body) {
      console.log('DM CONTROLLER ==> ', body)
      const is = await this.userservice.getUserByNameJson(body.oppoUsername)
      if (is)
      {
        const blocked = await this.userservice.getAllBlockedByUser(+is)
        const item = blocked.map(item => item.usersId).indexOf(body.userId)
        if (item < 0 && body.oppoUsername != body.username)
        {
          const channel = await this.userservice.createDm(body);
          const save = await this.userservice.assignDmAtCrea(body, body.userId, body.oppoUsername, body.id);
          const save2 = await this.userservice.assignDmAtCrea(body, is, body.username, body.id);
        }
        else
          return 'blocked'
      }
      else
        return '401'
    }

    @UseGuards(AuthGuard('jwt'))
    @UsePipes(ValidationPipe)
    @Get(':id')
    async register(@Param() userId: SearchParams){//: Promise<Partial<UserEntity>> {
      let id = +userId.id;
      let presets;
      let form;
      const back = await this.userservice.findOne(id)
      const matchs = await this.userservice.getMatchsByUser(id)
      const blocked = await this.userservice.getAllBlockedByUser(id)
      const friends = await this.userservice.getAllFriendsByUser(id)
      const level = await this.userservice.getUserLevel(id)
      const userPresets = await this.userservice.getUserPresets(id)
      const userForm = await this.userservice.getUser(id)
      if (!userPresets.presets[0])
      {
        presets = await this.userservice.createPresets(id)
        if (!userForm.ball)
          form = await this.userservice.updateUserForm(id)
      }
      else
        presets = userPresets;
        form = userForm.ball;
      /*if (!matchs && !blocked)
        return {
              username: back.username,
              picture: back.picture,
          }*/
      //else if (blocked)
        let i = matchs.length
        let j = 0;
        while (j < i)
        {
            const pic1 = await this.userservice.getUserPicture(matchs[j].AdverId)
            const name = await this.userservice.findOne(matchs[j].AdverId)
            matchs[j].AdverPicture = pic1.picture
            matchs[j].Advername = name.username
            j++;
        }
        return {
              username: back.username,
              picture: back.picture,
              matchs: matchs,
              blocked: blocked,
              friends: friends,
              level: level,
              exp: back.exp,
              presets: presets,
              forme: form,
              twofa: back.isTwoFactorEnabled,
              qrcode: back.qrcode
          }
        // retourner egalement les personnes bloques par le user
    }

    @UseGuards(AuthGuard('jwt'))
    @UsePipes(ValidationPipe)
    @Post('preset/:id')
    async saveUserPreset(@Body() body) {
      return '200'
    }
    @UseGuards(AuthGuard('jwt'))
    @UsePipes(ValidationPipe)
    @Post(':id')
    @UseInterceptors(FileInterceptor('file',
        {
      storage: diskStorage({
        destination: './avatar',
        filename: editFileName
      }),
    fileFilter: imageFilter,
    }),
    )
    async upload(@UploadedFile() file: Express.Multer.File, @Body() body: UserDetails, @Param() id: SearchParams) {
    console.log('IN')
    console.log(body)
	  const save = +id.id;
	  if (file)
	  {
		    const picture = "http://localhost:3000/" + file.filename;
      	const mod = await this.userservice.updateUser(save, body, picture);
	  }
	  else
	  {
      const preset = await this.userservice.updatePresets(save, body)
      const forme = await this.userservice.updateForme(save, body)
		  const mod = await this.userservice.updateUser(save, body, null);
	  }
    }

    @UseGuards(AuthGuard('jwt'))
    @UsePipes(ValidationPipe)
     @Delete(':id')
     delete_user_info(@Param('id') id: SearchParams, @Req() req, @Res() res) {
        const save = +id;
        return this.userservice.deleteUser(save);
     }
}