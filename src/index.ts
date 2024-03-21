import app from './app';

const port = Number(process.env.PORT) || 3000;

app.listen(port, '0.0.0.0', () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://192.168.101.141:${port}`);
  /* eslint-enable no-console */
});
