import * as moment from 'moment-timezone';

export class DateUtils {
  private static readonly TIMEZONE = 'America/Argentina/Buenos_Aires';

  /**
   * Obtiene la fecha actual en timezone de Argentina
   */
  static now(): Date {
    return moment().tz(this.TIMEZONE).toDate();
  }

  /**
   * Convierte una fecha a timezone de Argentina
   */
  static toArgentinaTimezone(date: Date): Date {
    return moment(date).tz(this.TIMEZONE).toDate();
  }

  /**
   * Obtiene la fecha actual en timezone de Argentina como string ISO
   */
  static nowISO(): string {
    return moment().tz(this.TIMEZONE).toISOString();
  }

  /**
   * Agrega horas a una fecha en timezone de Argentina
   */
  static addHours(date: Date, hours: number): Date {
    return moment(date).tz(this.TIMEZONE).add(hours, 'hours').toDate();
  }

  /**
   * Agrega minutos a una fecha en timezone de Argentina
   */
  static addMinutes(date: Date, minutes: number): Date {
    return moment(date).tz(this.TIMEZONE).add(minutes, 'minutes').toDate();
  }

  /**
   * Verifica si una fecha ha expirado (es anterior a la fecha actual en Argentina)
   */
  static isExpired(date: Date): boolean {
    return moment(date).tz(this.TIMEZONE).isBefore(moment().tz(this.TIMEZONE));
  }

  /**
   * Formatea una fecha para mostrar en Argentina
   */
  static formatArgentina(date: Date, format: string = 'DD/MM/YYYY HH:mm:ss'): string {
    return moment(date).tz(this.TIMEZONE).format(format) + ' (Argentina)';
  }

  /**
   * Formatea una fecha de expiración de manera más clara
   */
  static formatExpiration(date: Date): string {
    const now = moment().tz(this.TIMEZONE);
    const expiration = moment(date).tz(this.TIMEZONE);
    const diff = expiration.diff(now, 'minutes');

    if (diff <= 0) {
      return 'Expirado';
    } else if (diff < 60) {
      return `${diff} minutos restantes (${expiration.format('HH:mm:ss')} - Argentina)`;
    } else {
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      return `${hours}h ${minutes}m restantes (${expiration.format('DD/MM/YYYY HH:mm:ss')} - Argentina)`;
    }
  }

  /**
   * Obtiene el nombre del timezone
   */
  static getTimezone(): string {
    return this.TIMEZONE;
  }
}
