import TelaFraseLeitura from "@/components/onboarding/TelaFraseLeitura";

export default function RitmoPage() {
  return (
    <TelaFraseLeitura
      funcao="ritmo"
      caminhoAtual="/onboarding/ritmo"
      proximaRota="/onboarding/horario"
    />
  );
}
