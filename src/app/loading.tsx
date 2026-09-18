import EsqueletoTela from "@/components/EsqueletoTela";

/**
 * A Home passou a montar o dia inteiro — ritual, semana, tarefas, treino e
 * peso. São consultas em paralelo e rápidas, mas deixaram de ser duas: sem
 * esta fronteira, a primeira tela do app abriria em branco enquanto o
 * servidor junta tudo.
 */
export default function Carregando() {
  return <EsqueletoTela linhas={4} />;
}
