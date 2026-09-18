import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // O padrão é 1MB. A foto de antes e depois chega reduzida pelo
      // navegador (JPEG, 1200px no lado maior), o que dá algo entre 200 e
      // 500KB — mas uma foto muito ruidosa encosta no teto, e aí o Next
      // recusaria antes do código ver o arquivo. O limite do servidor em
      // `salvarFoto` é 2MB; este acompanha, para a recusa vir de lá, onde
      // ela é entendida.
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
