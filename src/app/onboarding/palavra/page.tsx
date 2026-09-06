import TelaFraseLeitura from "@/components/onboarding/TelaFraseLeitura";

export default function PalavraPage() {
  return (
    <TelaFraseLeitura
      funcao="palavra"
      caminhoAtual="/onboarding/palavra"
      proximaRota="/onboarding/ritmo"
    />
  );
}
