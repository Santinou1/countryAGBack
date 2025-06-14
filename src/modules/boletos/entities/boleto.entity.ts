import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum EstadoBoleto {
    PENDIENTE = 'pendiente',
    APROBADO = 'aprobado',
    RECHAZADO = 'rechazado'
}

@Entity('boletos')
export class Boleto {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;

    @Column({ name: 'idUsers' })
    idUsers: number;

    @Column({ name: 'codigo_boleto' })
    codigoBoleto: string;

    @Column({ name: 'lote' })
    lote: string;

    @Column({
        name: 'estado',
        type: 'enum',
        enum: EstadoBoleto,
        default: EstadoBoleto.PENDIENTE
    })
    estado: EstadoBoleto;

    @Column({ name: 'ida', default: false })
    ida: boolean;

    @Column({ name: 'vuelta', default: false })
    vuelta: boolean;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'idUsers' })
    usuario: User;
} 