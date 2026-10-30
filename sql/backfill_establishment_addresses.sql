-- Preserva os endereços legados sem inventar coordenadas e sem substituir
-- endereços já cadastrados. Atendimento por cidades não é endereço fixo.
INSERT INTO public.enderecos (estabelecimento_id, endereco_texto)
SELECT s.id, btrim(s.localizacao)
FROM public.estabelecimentos s
WHERE btrim(s.localizacao) <> ''
  AND s.localizacao NOT ILIKE 'Atendimento em:%'
  AND NOT EXISTS (
    SELECT 1 FROM public.enderecos e WHERE e.estabelecimento_id = s.id
  )
ON CONFLICT (estabelecimento_id) DO NOTHING;
