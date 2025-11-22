export interface ProxyConfig {
  baseUrl: string;
  mediaBaseUrl?: string;
}

export function getProxyConfig(): ProxyConfig {
  const baseUrl = process.env.REACT_APP_PROXY_BASE_URL ?? "";
  const mediaBaseUrl = process.env.REACT_APP_MEDIA_BASE_URL ?? "";

  return {
    baseUrl,
    mediaBaseUrl: mediaBaseUrl || undefined,
  };
}

export function ensureProxyConfig(): ProxyConfig {
  const config = getProxyConfig();
  if (!config.baseUrl) {
    throw new Error("REACT_APP_PROXY_BASE_URL não configurado no .env");
  }

  return config;
}
