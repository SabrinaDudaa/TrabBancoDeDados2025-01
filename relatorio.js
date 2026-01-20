import express from 'express';
import pool from './db.js';

const router = express.Router();

// funçao pra mostrar os filtros aqui
function montarFiltros(req) {
  const filtros = [];
  const valores = [];
  let i = 1;

  // filtrando por id
  if (req.query.id && /^\d+$/.test(req.query.id)) {
    filtros.push(`iddespesa = $${i}`);
    valores.push(Number(req.query.id));
    i++;
  }

  // filtrando o valor, adicionei um botão de maior e um de menor, para fazer sentido
  if (
    req.query.valor &&
    !isNaN(req.query.valor) &&
    (req.query.valorOp === 'gt' || req.query.valorOp === 'lt')
  ) {
    const operador = req.query.valorOp === 'gt' ? '>' : '<';
    filtros.push(`valor ${operador} $${i}`);
    valores.push(Number(req.query.valor));
    i++;
  }

  // os campos que estao la no front da busca.html
  const campos = [
    'tipo_idtipo',
    'elementodesp_idelementodesp',
    'especie_idespecie',
    'favorecido_idfavorecido',
    'ano'
  ];

  for (const campo of campos) {
    if (req.query[campo]) {
      filtros.push(`${campo} = $${i}`);
      valores.push(req.query[campo]);
      i++;
    }
  }

  // filtrando por mes, no estilo like
  if (req.query.mes) {
    filtros.push(`mes ILIKE $${i}`);
    valores.push(`%${req.query.mes}%`);
    i++;
  }

  // filtrando por unidade, no estilo like tambem
  if (req.query.unidade) {
    filtros.push(`unidade ILIKE $${i}`);
    valores.push(`%${req.query.unidade}%`);
    i++;
  }

  // filtrei por periodo aqui
  if (req.query.dataInicio && req.query.dataFim) {
    filtros.push(`data BETWEEN $${i} AND $${i + 1}`);
    valores.push(req.query.dataInicio, req.query.dataFim);
    i += 2;
  }

  return { filtros, valores };
}

// parte do relatorio em html aqui
router.get('/relatorio', async (req, res) => {
  const { filtros, valores } = montarFiltros(req);

  let sql = 'SELECT * FROM public.despesa';
  if (filtros.length > 0) {
    sql += ' WHERE ' + filtros.join(' AND ');
  }
// aqui eu executei a query e montei o html
  try {
    const result = await pool.query(sql, valores);
    const queryString = new URLSearchParams(req.query).toString();

    let html = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>Relatório</title>
</head>
<body>
<h2>Relatório de Despesas</h2>

<a href="/relatorio/xml?${queryString}">Exportar XML</a>
<br><br>

<table border="1">
<tr>
<th>ID</th>
<th>Tipo</th>
<th>Elemento</th>
<th>Espécie</th>
<th>Favorecido</th>
<th>Ano</th>
<th>Mês</th>
<th>Data</th>
<th>Valor</th>
<th>Unidade</th>
</tr>
`;

    for (const d of result.rows) {
      html += `
<tr>
<td>${d.iddespesa}</td>
<td>${d.tipo_idtipo}</td>
<td>${d.elementodesp_idelementodesp}</td>
<td>${d.especie_idespecie}</td>
<td>${d.favorecido_idfavorecido}</td>
<td>${d.ano}</td>
<td>${d.mes}</td>
<td>${d.data}</td>
<td>${d.valor}</td>
<td>${d.unidade}</td>
</tr>
`;
    }
// fechei o html aqui
    html += `
</table>
<br>
<a href="/busca.html">Voltar</a>
</body>
</html>
`;
// enviei
    res.send(html);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// parte do xml aqui
router.get('/relatorio/xml', async (req, res) => {
  const { filtros, valores } = montarFiltros(req);

  let sql = 'SELECT * FROM public.despesa';
  if (filtros.length > 0) {
    sql += ' WHERE ' + filtros.join(' AND ');
  }
// executando a query e montando o xml
  try {
    const result = await pool.query(sql, valores);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<despesas>\n`;

    for (const d of result.rows) {
      xml += `
<despesa>
<id>${d.iddespesa}</id>
<tipo>${d.tipo_idtipo}</tipo>
<elemento>${d.elementodesp_idelementodesp}</elemento>
<especie>${d.especie_idespecie}</especie>
<favorecido>${d.favorecido_idfavorecido}</favorecido>
<ano>${d.ano}</ano>
<mes>${d.mes}</mes>
<data>${d.data}</data>
<valor>${d.valor}</valor>
<unidade>${d.unidade}</unidade>
</despesa>
`;
    }

    xml += `</despesas>`;

    res.setHeader('Content-Disposition', 'attachment; filename="relatorio.xml"');
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
// aqui eu exportei o router
export default router;
