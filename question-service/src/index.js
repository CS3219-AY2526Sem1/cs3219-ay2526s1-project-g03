import express from 'express';

const app = express();
const port = '8083';

app.get('/', (req, res) => {
  res.send('Hello Question Service!');
  console.log('Response sent');
});

app.listen(port, () => {
  console.log(`Question Service listening on http://localhost:${port}`);
});
