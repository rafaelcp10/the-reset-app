import TelaFraseLeitura from "@/components/onboarding/TelaFraseLeitura";

export default function SegurancaPage() {
  return (
    <TelaFraseLeitura
      funcao="seguranca"
      caminhoAtual="/onboarding/seguranca"
      proximaRota="/onboarding/como-falo"
    />
  );
}
