-- O agendador das notificações, dentro do próprio Supabase.
--
-- Fora de `migrations/` de propósito: leva dois valores que só existem no
-- painel — o endereço do app e o CRON_SECRET — e eles não podem ir para o
-- repositório. Rode no SQL Editor do Supabase **depois** da migration
-- `20261024000000_notificacoes_escalaveis.sql`.
--
-- Por que aqui, e não no GitHub Actions: o agendamento do GitHub é "melhor
-- esforço" e rodava de 2 em 5 horas num cron de 30 minutos. O `pg_cron`
-- roda no minuto marcado, de graça, no mesmo banco onde estão os dados, e
-- guarda o segredo no cofre (Vault) em vez de numa tabela legível. O
-- workflow do GitHub pode continuar existindo como reserva: as funções de
-- reserva garantem que os dois rodando juntos não duplicam aviso nenhum.

-- 1. As duas extensões (também dá para ligar em Database → Extensions).
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Os segredos, no cofre. **Troque os dois valores entre aspas** antes de
--    rodar: o endereço do app em produção, sem barra no fim, e o mesmo
--    CRON_SECRET que está nas variáveis de ambiente da Vercel.
--
--    Cria se não existir e atualiza se já existir: rodar o arquivo de novo
--    não dá erro, e é assim que se corrige um valor gravado errado. A
--    primeira versão usava só `create_secret`, que falha com "duplicate
--    key" na segunda vez — e deixava o resto do arquivo sem rodar.
do $$
declare
  segredos constant text[][] := array[
    ['app_url',     'https://SEU-APP.vercel.app'],
    ['cron_secret', 'COLE-AQUI-O-CRON-SECRET']
  ];
  i int;
  existente uuid;
begin
  for i in 1 .. array_length(segredos, 1) loop
    select id into existente from vault.secrets where name = segredos[i][1];
    if existente is null then
      perform vault.create_secret(segredos[i][2], segredos[i][1]);
    else
      perform vault.update_secret(existente, segredos[i][2]);
    end if;
  end loop;
end
$$;

-- 3. A chamada de uma rota, lendo os segredos do cofre na hora — o comando
--    agendado fica sem segredo nenhum escrito nele, e `cron.job` é legível.
create or replace function chamar_rota_cron(p_rota text)
returns bigint
language sql
security definer
set search_path = public, extensions
as $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'app_url')
           || '/api/cron/' || p_rota,
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    -- O padrão do pg_net é 5 segundos; a rota pode trabalhar até 60.
    timeout_milliseconds := 60000
  )
$$;

revoke execute on function chamar_rota_cron(text) from public, anon, authenticated;

-- 4. De minuto em minuto. Rodar este bloco de novo é seguro: agendar com um
--    nome que já existe substitui o agendamento antigo.
select cron.schedule('notificacoes-checkin', '* * * * *', $$select chamar_rota_cron('checkin')$$);
select cron.schedule('notificacoes-lembretes', '* * * * *', $$select chamar_rota_cron('lembretes')$$);

-- 5. A limpeza, uma vez por dia às 3h15 de Brasília (6h15 UTC).
--    `lembretes_enviados` ganha umas seis linhas por pessoa por dia — com
--    cem mil pessoas, 200 milhões por ano. Só o dia de hoje é consultado,
--    então duas semanas de folga bastam. O registro das execuções guarda
--    um mês, e o histórico do próprio pg_cron, uma semana.
select cron.schedule('limpar-historicos', '15 6 * * *', $$
  delete from lembretes_enviados where data < current_date - 14;
  delete from execucoes_cron where inicio < now() - interval '30 days';
  delete from cron.job_run_details where end_time < now() - interval '7 days';
$$);

-- ---------------------------------------------------------------------------
-- Para conferir, alguns minutos depois:
--
--   select jobname, schedule, active from cron.job;
--
--   -- o batimento cardíaco: uma linha por minuto por rota
--   select rota, inicio, reservados, enviados, falhas, erro
--   from execucoes_cron order by inicio desc limit 10;
--
--   -- a resposta HTTP de cada chamada (fica guardada por 6 horas)
--   select status_code, content::text, created
--   from net._http_response order by created desc limit 10;
