// import { UserRoleEnum } from "src/enum/user_role.enum";
// import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
// import { UserEntity } from "./user.entity";

// @Entity('matchs')
// export class MatchEntity {

//     // liste des éléments composants la table
//     @PrimaryGeneratedColumn()
//     id: string;

//     @Column({
//         unique: false,
//         nullable: true,
//     })
//     adversaire: string;

//     @Column({
//         unique: false,
//         nullable: true,
//     })
//     UserScore:string;
//     @Column({
//         unique: false,
//         nullable: true,
//     })
//     AdversaireScore:string;

//     @ManyToOne(
//         type => UserEntity,
//         (user) => user.matchs,
//         {cascade: ['insert', 'update']}
//     )
//     user: UserEntity
// }