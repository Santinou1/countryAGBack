import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Boleto } from '../modules/boletos/entities/boleto.entity';
import { EscaneoQR } from '../modules/qr/entities/escaneo-qr.entity';
import { config } from 'dotenv';

// Cargar las variables de entorno
config();

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Boleto, EscaneoQR],
  synchronize: false, // Lo dejamos en false para no alterar la estructura de la base de datos existente
  logging: false, // Desactivamos el logging de queries
  extra: {
    timezone: '-03:00',
    charset: 'utf8mb4_unicode_ci',
  },
};
