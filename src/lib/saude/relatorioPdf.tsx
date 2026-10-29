import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Relatorio } from "./relatorio";
import { escreverPercentual } from "./progresso";
import { kg } from "./serie";
import { horas, milhar, nomeDoMes } from "./relatorioTexto";
import { mesAnterior } from "./relatorio";

/**
 * O relatório em PDF.
 *
 * Gerado no servidor, como arquivo, porque o "imprimir" do navegador não
 * faz nada em app instalado no iPhone — e é instalado que o app é usado.
 * O arquivo sai pelo menu de compartilhar: Arquivos, WhatsApp, AirDrop.
 *
 * Fundo claro, ao contrário do app: PDF é lido em papel, em computador, por
 * outra pessoa às vezes — o professor, o nutricionista. **Sem as fotos do
 * corpo**: são o dado mais sensível que o app guarda, e o PDF sai dele.
 *
 * Helvetica, que todo leitor de PDF já tem, em vez de embutir fonte. Ela
 * não tem o menos tipográfico nem a seta, então os dois são trocados aqui
 * por traço e por "a".
 */

const TEXTO = "#101114";
const AUXILIAR = "#55575c";
const FILETE = "#e3e3e0";
const ACENTO = "#C97B3A";

function limpo(texto: string): string {
  return texto.replace(/−/g, "–").replace(/→/g, "a");
}

const e = StyleSheet.create({
  pagina: { padding: 40, fontFamily: "Helvetica", fontSize: 10.5, color: TEXTO, lineHeight: 1.45 },
  marca: { fontSize: 9, color: AUXILIAR, letterSpacing: 1.2, textTransform: "uppercase" },
  titulo: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 4 },
  subtitulo: { fontSize: 11, color: AUXILIAR, marginTop: 2 },
  regua: { height: 2, backgroundColor: ACENTO, width: 40, marginTop: 12, marginBottom: 18 },
  secao: { marginBottom: 18 },
  rotulo: { fontSize: 9, color: AUXILIAR, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  numeros: { flexDirection: "row", flexWrap: "wrap" },
  numero: { width: "33.33%", marginBottom: 10 },
  numeroValor: { fontSize: 17, fontFamily: "Helvetica-Bold", lineHeight: 1.2, marginBottom: 3 },
  numeroRotulo: { fontSize: 9.5, color: AUXILIAR },
  dica: { borderLeftWidth: 2, borderLeftColor: FILETE, paddingLeft: 10, marginBottom: 9 },
  dicaObservacao: { fontFamily: "Helvetica-Bold", fontSize: 10.5 },
  dicaSugestao: { color: AUXILIAR, marginTop: 2 },
  treinoTitulo: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, marginBottom: 4 },
  treinoNome: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  linha: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: FILETE },
  celulaNome: { flex: 1 },
  celulaCarga: { width: 110, textAlign: "right" },
  celulaVariacao: { width: 50, textAlign: "right", color: AUXILIAR },
  celulaTreinos: { width: 60, textAlign: "right", color: AUXILIAR },
  grupo: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  grupoNome: { width: 80 },
  grupoTrilho: { flex: 1, height: 6, backgroundColor: "#efefec", borderRadius: 3 },
  grupoBarra: { height: 6, backgroundColor: AUXILIAR, borderRadius: 3 },
  grupoNumero: { width: 36, textAlign: "right", color: AUXILIAR },
  rodape: { position: "absolute", bottom: 22, left: 40, fontSize: 8.5, color: AUXILIAR },
});

export function DocumentoRelatorio({ r, geradoEm }: { r: Relatorio; geradoEm: string }) {
  const titulo = r.parcial ? `${nomeDoMes(r.mes, false)}, até ${geradoEm}` : nomeDoMes(r.mes);
  const antes = nomeDoMes(mesAnterior(r.mes), false);
  const maiorGrupo = Math.max(1, ...r.grupos.map((g) => g.series));

  const numeros: [string, string, string | null][] = [
    [String(r.resumo.treinos), r.resumo.treinos === 1 ? "treino" : "treinos", r.anterior && String(r.anterior.treinos)],
    [String(r.resumo.semanas), r.resumo.semanas === 1 ? "semana com treino" : "semanas com treino", r.anterior && String(r.anterior.semanas)],
    [horas(r.resumo.minutos), "de treino", r.anterior && horas(r.anterior.minutos)],
    [milhar(r.resumo.series), "séries", r.anterior && milhar(r.anterior.series)],
    [`${milhar(r.resumo.volume)} kg`, "de volume", r.anterior && `${milhar(r.anterior.volume)} kg`],
  ];

  return (
    <Document title={`The Reset — relatório de ${nomeDoMes(r.mes)}`} author="The Reset">
      <Page size="A4" style={e.pagina}>
        <Text style={e.marca}>The Reset · Relatório de progressão</Text>
        <Text style={e.titulo}>{titulo}</Text>
        <View style={e.regua} />

        <View style={e.secao}>
          <Text style={e.rotulo}>O mês</Text>
          <View style={e.numeros}>
            {numeros.map(([valor, rotulo, anterior]) => (
              <View key={rotulo} style={e.numero}>
                <Text style={e.numeroValor}>{valor}</Text>
                <Text style={e.numeroRotulo}>{rotulo}</Text>
                {anterior !== null && (
                  <Text style={e.numeroRotulo}>
                    {antes}: {anterior}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {r.dicas.length > 0 && (
          <View style={e.secao}>
            <Text style={e.rotulo}>Dicas</Text>
            {r.dicas.map((d) => (
              <View key={`${d.tipo}-${d.movimentoId}`} style={e.dica} wrap={false}>
                <Text style={e.dicaObservacao}>{limpo(d.observacao)}</Text>
                <Text style={e.dicaSugestao}>{limpo(d.sugestao)}</Text>
              </View>
            ))}
            <Text style={{ color: AUXILIAR, fontSize: 9 }}>
              Convenções de academia, não regras. O seu corpo, e quem acompanha o seu treino, sabem mais.
            </Text>
          </View>
        )}

        <View style={e.secao}>
          <Text style={e.rotulo}>Por treino</Text>
          {r.porTreino.map((t) => (
            <View key={t.titulo} wrap={false}>
              <View style={e.treinoTitulo}>
                <Text style={e.treinoNome}>{t.titulo}</Text>
                {t.variacaoMedia !== null && (
                  <Text style={{ color: AUXILIAR }}>{limpo(escreverPercentual(t.variacaoMedia))} na carga</Text>
                )}
              </View>
              {t.itens.map((i) => (
                <View key={i.movimentoId} style={e.linha}>
                  <Text style={e.celulaNome}>{i.nome}</Text>
                  <Text style={e.celulaCarga}>
                    {i.primeira !== i.ultima ? `${kg(i.primeira)} a ${kg(i.ultima)} kg` : `${kg(i.ultima)} kg`}
                  </Text>
                  <Text style={e.celulaVariacao}>
                    {i.variacao !== null ? limpo(escreverPercentual(i.variacao)) : ""}
                  </Text>
                  <Text style={e.celulaTreinos}>
                    {i.sessoes} {i.sessoes === 1 ? "treino" : "treinos"}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {r.grupos.length > 0 && (
          <View style={e.secao} wrap={false}>
            <Text style={e.rotulo}>Séries por grupo</Text>
            {r.grupos.map((g) => (
              <View key={g.rotulo} style={e.grupo}>
                <Text style={e.grupoNome}>{g.rotulo}</Text>
                <View style={e.grupoTrilho}>
                  <View style={[e.grupoBarra, { width: `${(g.series / maiorGrupo) * 100}%` }]} />
                </View>
                <Text style={e.grupoNumero}>{g.series}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Direto na página, e não dentro de uma View: o rodapé fixo
            dentro de uma View posicionada não era desenhado. Sem número
            de página — o texto calculado por página (`render`) não sai
            nesta versão da biblioteca, e um relatório de duas páginas não
            precisa dele. */}
        <Text style={e.rodape} fixed>
          The Reset · gerado em {geradoEm}
        </Text>
      </Page>
    </Document>
  );
}
