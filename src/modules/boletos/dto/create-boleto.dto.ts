import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBoletoDto {
    @IsString()
    @IsNotEmpty({ message: 'El lote es requerido' })
    lote: string;
} 