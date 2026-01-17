import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { parseStringPromise } from 'xml2js';
import pool from './db.js';
import path from 'path';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});

app.post('/upload', upload.single('arquivo'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const nomeOriginal = req.file.originalname;

    let dados;

    if (nomeOriginal.endsWith('.json')) {
      dados = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else if (nomeOriginal.endsWith('.xml')) {
      const xml = fs.readFileSync(filePath, 'utf8');
      dados = await parseStringPromise(xml, { explicitArray: false });
    } else {
      return res.status(400).send('Formato não suportado');
    }

    const sql = await gerarScriptSQL(dados);
    fs.writeFileSync('sql/insert_despesas.sql', sql);

    res.download('sql/insert_despesas.sql');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao processar arquivo');
  }
});

async function gerarScriptSQL(dados) {
  let sql = '';

  for (const d of dados.despesas) {
    // TIPO
    sql += `
INSERT INTO Tipo (tipoPG)
SELECT '${d.tipo}'
WHERE NOT EXISTS (
  SELECT 1 FROM Tipo WHERE tipoPG = '${d.tipo}'
);
`;

    // ELEMENTO
    sql += `
INSERT INTO ElementoDesp (ElementoDesp)
SELECT '${d.elemento}'
WHERE NOT EXISTS (
  SELECT 1 FROM ElementoDesp WHERE ElementoDesp = '${d.elemento}'
);
`;

    // ESPÉCIE
    sql += `
INSERT INTO Especie (Especie)
SELECT '${d.especie}'
WHERE NOT EXISTS (
  SELECT 1 FROM Especie WHERE Especie = '${d.especie}'
);
`;

    // FAVORECIDO
    sql += `
INSERT INTO Favorecido (nome, documento)
SELECT '${d.favorecido.nome}', '${d.favorecido.documento}'
WHERE NOT EXISTS (
  SELECT 1 FROM Favorecido WHERE documento = '${d.favorecido.documento}'
);
`;

    // DESPESA
    sql += `
INSERT INTO Despesa (
  Tipo_idTipo,
  ElementoDesp_idElementoDesp,
  Especie_idEspecie,
  Favorecido_idFavorecido,
  ano,
  Mes,
  data,
  valor,
  unidade,
  pagamento,
  subtitulo
)
VALUES (
  (SELECT idTipo FROM Tipo WHERE tipoPG = '${d.tipo}'),
  (SELECT idElementoDesp FROM ElementoDesp WHERE ElementoDesp = '${d.elemento}'),
  (SELECT idEspecie FROM Especie WHERE Especie = '${d.especie}'),
  (SELECT idFavorecido FROM Favorecido WHERE documento = '${d.favorecido.documento}'),
  ${d.ano},
  '${d.mes}',
  '${d.data}',
  ${d.valor},
  '${d.unidade}',
  ${d.pagamento},
  '${d.subtitulo}'
);
`;
  }

  return sql;
}
