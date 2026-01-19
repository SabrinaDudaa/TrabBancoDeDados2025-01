import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { parseStringPromise } from 'xml2js';
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
    const nomeOriginal = req.file.originalname.toLowerCase();

    let dados;
    let registros = [];

    // ===== LEITURA =====
    if (nomeOriginal.endsWith('.json')) {
      dados = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      registros = Array.isArray(dados) ? dados : [dados];
    } else if (nomeOriginal.endsWith('.xml')) {
      const xml = fs.readFileSync(filePath, 'utf8');
      dados = await parseStringPromise(xml, { explicitArray: false });

      const itens = dados.Items?.Item;
      if (!itens) {
        return res.status(400).send('XML em formato inesperado');
      }

      registros = Array.isArray(itens) ? itens : [itens];
    } else {
      return res.status(400).send('Formato não suportado');
    }

    // ===== GERAR SQL =====
    const sql = gerarScriptSQL(registros);

    fs.mkdirSync('sql', { recursive: true });
    fs.writeFileSync('sql/insert_despesas.sql', sql);

    res.download('sql/insert_despesas.sql');
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// ======================================================
// GERADOR DE SCRIPT SQL (XML REAL DA PREFEITURA)
// ======================================================
function gerarScriptSQL(registros) {
  let sql = '';

  for (const item of registros) {
    const ano = Number(item.ano);
    const mes = item.mes;
    const dataBr = item.data.split(' ')[0]; // 13/01/2026
    const [dia, mesNum, anoNum] = dataBr.split('/');
    const data = `${anoNum}-${mesNum}-${dia}`; // 2026-01-13
    const unidade = item.unidade_gestora;
    const especie = item.especie;
    const elemento = item.elemento_despesa;
    const subtitulo = item.subtitulo || null;

    const valor = Number(item.valor.replace(/\./g, '').replace(',', '.'));

    const favorecidoNome = item.nome_favorecido;
    const favorecidoDoc = item.documento_favorecido;

    // ===== FAVORECIDO =====
    sql += `
INSERT INTO Favorecido (nome, documento)
SELECT '${favorecidoNome}', '${favorecidoDoc}'
WHERE NOT EXISTS (
  SELECT 1 FROM Favorecido WHERE documento = '${favorecidoDoc}'
);
`;

    // ===== ESPÉCIE =====
    sql += `
INSERT INTO Especie (Especie)
SELECT '${especie}'
WHERE NOT EXISTS (
  SELECT 1 FROM Especie WHERE Especie = '${especie}'
);
`;

    // ===== ELEMENTO =====
    sql += `
INSERT INTO ElementoDesp (ElementoDesp)
SELECT '${elemento}'
WHERE NOT EXISTS (
  SELECT 1 FROM ElementoDesp WHERE ElementoDesp = '${elemento}'
);
`;

    // ===== DESPESA =====
    sql += `
INSERT INTO Despesa (
  Especie_idEspecie,
  ElementoDesp_idElementoDesp,
  Favorecido_idFavorecido,
  ano,
  mes,
  data,
  valor,
  unidade,
  subtitulo
)
VALUES (
  (SELECT idEspecie FROM Especie WHERE Especie = '${especie}'),
  (SELECT idElementoDesp FROM ElementoDesp WHERE ElementoDesp = '${elemento}'),
  (SELECT idFavorecido FROM Favorecido WHERE documento = '${favorecidoDoc}'),
  ${ano},
  '${mes}',
  '${data}',
  ${valor},
  '${unidade}',
  ${subtitulo ? `'${subtitulo}'` : 'NULL'}
);
`;
  }

  return sql;
}
