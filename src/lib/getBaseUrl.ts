import { cache } from 'react';

export const getBaseUrl = cache(
  () => {
    return process.env.TUNNEL
      ? `https://api.rsasesorjuridico.com`
      : `http://localhost:${ process.env.PORT ?? 6969 }`;
  },
);
