import Link from "next/link";

export default function BotaoEspelho() {
  return (
    <Link
      href="/ritual/espelho"
      className="block w-full rounded-full bg-acento py-3 text-center font-interface font-medium text-fundo"
    >
      Entrar no espelho
    </Link>
  );
}
