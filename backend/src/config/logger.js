const pino = require('pino');

const isDev = process.env.NODE_ENV === 'development';
const level = process.env.LOG_LEVEL || (isDev ? 'info' : 'info');

const logger = pino({
  level,
  ...(isDev && {
    transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } },
  }),
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.confirmPassword'],
    censor: '[REDACTED]',
  },
});

module.exports = logger;