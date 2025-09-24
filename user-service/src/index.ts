import express from 'express';

const app = express();
const port = 8080;

app.get('/', (req, res) => {
  return res.status(200).json({
    status: "healthy",
  });
});

app.listen(port, () => {
  console.log(`User Service listening on http://localhost:${port}`);
});
