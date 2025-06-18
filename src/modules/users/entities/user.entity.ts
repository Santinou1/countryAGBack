import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from './user-role.enum';

@Entity('Personas')
export class User {
    @PrimaryGeneratedColumn({ name: 'Id' })
    id: number;

    @Column({ name: 'Nombre' })
    nombre: string;

    @Column({ name: 'Apellido' })
    apellido: string;

    @Column({ name: 'Email', unique: true })
    email: string;

    @Column({ name: 'Contraseña' })
    contraseña: string;

    @Column({
        name: 'Rol',
        type: 'enum',
        enum: UserRole,
        default: UserRole.USUARIO
    })
    rol: UserRole;

    @Column({ name: 'DNI', unique: true, nullable: true })
    dni: string;
}
