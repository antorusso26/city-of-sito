import type { NextConfig } from "next";

const config: NextConfig = {
  // I contenuti sono file in /content: tutte le pagine si generano in fase di build.
  poweredByHeader: false,
};

export default config;
