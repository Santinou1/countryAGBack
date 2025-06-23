module.exports = {
  apps: [
    {
      name: 'countryAG-back',
      script: 'npm',
      args: 'start', // asumiendo que "npm start" corre tu backend correctamente
      env: {
        // Variables de entorno PRODUCCIÓN
        DB_HOST: '172.31.50.154',
        DB_PORT: '3306',
        DB_USER: 'admin',
        DB_PASSWORD: 'P1r1d3gm1@',
        DB_NAME: 'countryAG',
        JWT_SECRET: '1234321',
        PORT: '3142',
        MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-1409345633316523-062009-c38309734525c1183fdc0d3612bac582-2508865888',
        PUBLICK_KEY: 'APP_USR-1234a278-3ca3-4a61-b0dc-af45abaf5a39',
        CLIENT_ID: '1409345633316523',
        CLIENT_SECRET: 'v6hTBuxtp5AnxUlp5wa3tHi1c7Lj2zhJ',
        NGROK_KEY_SECRET: 'd5dfbe9aa5a34a15604bc75b471a9e0e7decd5f124ccc0242ccfe53c90ebe424',
      },
      env_local: {
        // Variables para desarrollo local, comentadas para activar manualmente si querés
        // DB_HOST: 'localhost',
        // DB_PORT: '3306',
        // DB_USER: 'root',
        // DB_PASSWORD: '',
        // DB_NAME: 'countryAG',
        // JWT_SECRET: '1234321',
      },
    },
  ],
};
