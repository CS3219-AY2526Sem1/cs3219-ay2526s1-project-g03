import express from 'express';

const app = express();
const port = '8082';

app.get('/', (req, res) => {
  res.send('Hello Collaboration Service!');
  console.log('Response sent');
});

app.listen(port, () => {
  console.log(`Collaboration Service listening on http://localhost:${port}`);
});
