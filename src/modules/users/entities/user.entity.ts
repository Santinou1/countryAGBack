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

    @Column({ name: 'Contraseña', type: 'varchar', nullable: true })
    contraseña: string | null;

    @Column({
        name: 'Rol',
        type: 'enum',
        enum: UserRole,
        default: UserRole.USUARIO
    })
    rol: UserRole;

    @Column({ name: 'DNI', unique: true, nullable: true })
    dni: string;

    @Column({ name: 'Celular', nullable: true })
    celular: string;

    @Column({ name: 'Area', nullable: true })
    area: string;

    @Column({ name: 'Lote', nullable: true })
    lote: string;

    @Column({ name: 'Ocupacion', nullable: true })
    ocupacion: string;

    @Column({ name: 'EsPropietario', type: 'boolean', default: false })
    esPropietario: boolean;

    @Column({ name: 'EsProveedor', type: 'boolean', default: false })
    esProveedor: boolean;
}
