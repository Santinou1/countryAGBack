import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Boleto } from '../../boletos/entities/boleto.entity';

@Entity('escaneos_qr')
export class EscaneoQR {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'boleto_id' })
    boletoId: number;

    @Column({ type: 'enum', enum: ['ida', 'vuelta'] })
    tipo: 'ida' | 'vuelta';

    @CreateDateColumn({ name: 'fecha_escaneo' })
    fechaEscaneo: Date;

    @Column({ name: 'escaneado_por' })
    escaneadoPor: number;

    @ManyToOne(() => Boleto)
    @JoinColumn({ name: 'boleto_id' })
    boleto: Boleto;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'escaneado_por' })
    admin: User;
} 