import express from 'express';

const app = express();
const port = '8080';

app.get('/', (req, res) => {
  res.send('Hello User Service!');
  console.log('Response sent');
});

app.listen(port, () => {
  console.log(`User Service listening on http://localhost:${port}`);
});
