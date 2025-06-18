import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DateUtils } from 'src/date-utils';

export enum EstadoBoleto {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
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
    default: EstadoBoleto.PENDIENTE,
  })
  estado: EstadoBoleto;

  @Column({ name: 'primer_uso', type: 'timestamp', nullable: true })
  primerUso: Date | null;

  @Column({ name: 'valido_hasta', type: 'timestamp', nullable: true })
  validoHasta: Date | null;

  @Column({ name: 'activo', default: true })
  activo: boolean;

  @Column({ name: 'contador', default: 0 })
  contador: number;

  @Column({ name: 'qr_activo', default: false })
  qrActivo: boolean;

  @Column({ name: 'qr_valido_hasta', type: 'timestamp', nullable: true })
  qrValidoHasta: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idUsers' })
  usuario: User;

  // Método para verificar si el boleto está activo y válido
  isValido(): boolean {
    if (!this.activo || this.estado !== EstadoBoleto.APROBADO) {
      return false;
    }

    // Si no se ha usado por primera vez, está válido
    if (!this.primerUso) {
      return true;
    }

    // Si ya se usó, verificar que no haya expirado (24 horas después del primer uso)
    if (this.validoHasta) {
      return !DateUtils.isExpired(this.validoHasta);
    }

    return false;
  }

  // Método para verificar si el QR está activo y válido (3 minutos después de activarse)
  isQRValido(): boolean {
    if (!this.qrActivo) {
      return false;
    }

    if (!this.qrValidoHasta) {
      return false;
    }

    return !DateUtils.isExpired(this.qrValidoHasta);
  }

  // Método para activar el QR (cuando se hace click para mostrar)
  activarQR(): void {
    this.qrActivo = true;
    this.qrValidoHasta = DateUtils.addMinutes(DateUtils.now(), 3); // 3 minutos
  }

  // Método para desactivar el QR (cuando se cierra)
  desactivarQR(): void {
    this.qrActivo = false;
    this.qrValidoHasta = null;
  }

  // Método para registrar el primer uso (cuando se escanea por primera vez)
  registrarPrimerUso(): void {
    if (!this.primerUso) {
      this.primerUso = DateUtils.now();
      this.validoHasta = DateUtils.addHours(this.primerUso, 24); // 24 horas
    }
  }

  // Método para incrementar el contador de usos
  incrementarContador(): void {
    this.contador += 1;
  }
}
