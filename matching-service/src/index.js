import express from 'express';

const app = express();
const port = '8081';

app.get('/', (req, res) => {
  res.send('Hello Matching Service!');
  console.log('Response sent');
});

app.listen(port, () => {
  console.log(`Matching Service listening on http://localhost:${port}`);
});
