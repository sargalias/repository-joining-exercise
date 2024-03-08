import express from 'express';
import searchRouter from './searchRouter';

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/search', searchRouter);

app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`);
});
