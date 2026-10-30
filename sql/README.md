# Endereços e proximidade

A tabela `public.enderecos` é a fonte do endereço cadastral e da posição dos estabelecimentos. As colunas antigas `estabelecimentos.latitude/longitude` não são usadas. `localizacao` continua disponível nas respostas por compatibilidade, calculada a partir de `enderecos`; para profissionais sem endereço fixo, mantém o texto da área de atendimento.

Execute `backfill_establishment_addresses.sql` uma vez para preservar os textos legados. É idempotente e não geocodifica nem altera registros existentes. Coordenadas antigas não são copiadas automaticamente.

`PATCH /v1/estabelecimentos/me/endereco` substitui o endereço do estabelecimento autenticado. Deve enviar endereço e as duas coordenadas, ou omitir ambas para remover a posição anterior. Atualiza `atualizado_em`. O backend precisa de acesso autorizado à tabela; o frontend não acessa o Supabase diretamente. Não exponha chaves privilegiadas no navegador.

`GET /v1/estabelecimentos/listar_estabelecimentos?latitude=-27.6&longitude=-48.6&raio_km=10` retorna ativos com distância em linha reta, ordenados do mais próximo. Posição sem raio inclui os sem posição ao final. Sem posição, mantém a lista geral. Raio exige posição, varia de mais de 0 até 500 km e exclui registros sem coordenadas. A posição do cliente não é gravada. Endereços e posições são retornados em `endereco`; `distancia_km` é nulo quando não calculável.

O cálculo Haversine na API atende o volume atual. Para uma base maior, mover filtro/ordenação e paginação para uma consulta geográfica indexada (PostGIS). Não confundir distância em linha reta com trajeto por ruas.

No frontend, o endereço manual/CEP pode ser consultado no Nominatim mediante ação do responsável. É necessário selecionar uma opção e conferir o mapa. A posição do dispositivo só deve ser usada estando no estabelecimento. Alterar o endereço limpa coordenadas antigas.

Validação: `python -m pytest -q tests` e `flake8 app/ --select=E9,F63,F7,F82`.
