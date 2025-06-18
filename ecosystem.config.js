module.exports = {
    apps: [
      {
        name: 'countryAG-back',
        script: 'src/main.ts',
        interpreter: 'node',
        exec_mode: 'fork',
        instances: 1,
        watch: false,
        interpreter_args: '-r ts-node/register',
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
  