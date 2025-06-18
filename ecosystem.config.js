// ecosystem.config.js
module.exports = {
    apps: [
      {
        name: 'countryAG-back',
        script: 'npm',
        args: 'start',
        env: {
          B_HOST: '172.31.50.156',
          DB_PORT: '3306',
          DB_USER: 'admin',
          DB_PASSWORD: 'P1r1d3gm1@',
          DB_NAME: 'countryAG',
          JWT_SECRET: '1234321',
          PORT: '3142',
        }
      }
    ]
  };
  