import express from 'express';
import relatorioRouter from './relatorio.js';

const app = express();

app.use(express.static('public'));

app.use('/', relatorioRouter);

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
