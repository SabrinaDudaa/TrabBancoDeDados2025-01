
INSERT INTO Tipo (tipoPG)
SELECT 'Alimentação'
WHERE NOT EXISTS (
  SELECT 1 FROM Tipo WHERE tipoPG = 'Alimentação'
);

INSERT INTO ElementoDesp (ElementoDesp)
SELECT 'Material de Consumo'
WHERE NOT EXISTS (
  SELECT 1 FROM ElementoDesp WHERE ElementoDesp = 'Material de Consumo'
);

INSERT INTO Especie (Especie)
SELECT 'Ordinária'
WHERE NOT EXISTS (
  SELECT 1 FROM Especie WHERE Especie = 'Ordinária'
);

INSERT INTO Favorecido (nome, documento)
SELECT 'Mercado Central', '12345678900'
WHERE NOT EXISTS (
  SELECT 1 FROM Favorecido WHERE documento = '12345678900'
);

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
  (SELECT idTipo FROM Tipo WHERE tipoPG = 'Alimentação'),
  (SELECT idElementoDesp FROM ElementoDesp WHERE ElementoDesp = 'Material de Consumo'),
  (SELECT idEspecie FROM Especie WHERE Especie = 'Ordinária'),
  (SELECT idFavorecido FROM Favorecido WHERE documento = '12345678900'),
  2025,
  'Janeiro',
  '2025-01-10',
  250.5,
  'Unidade A',
  250.5,
  'Compra mensal'
);
