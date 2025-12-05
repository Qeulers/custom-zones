// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.polestarglobal.com',
  ENDPOINTS: {
    AUTH: {
      SIGNIN: '/account/v2/auth/signin',
      REFRESH: '/account/v1/auth/access-token-refresh',
      PASSWORD_RESET_OTP: '/account/v1/auth/password-reset/otp',
      PASSWORD_RESET: '/account/v1/auth/password-reset',
    },
    ZONES: {
      LIST: '/zone-port-insights/v1/zones',
      SINGLE: (id: string) => `/zone-port-insights/v1/zones/${id}`,
      CUSTOM: '/zone-port-insights/v1/zones/custom',
      CUSTOM_UPDATE: (id: string) => `/zone-port-insights/v1/zones/custom/${id}`,
      TRAFFIC: (idType: string, id: string) => `/zone-port-insights/v1/zone-and-port-traffic/${idType}/${id}`,
      VESSELS_IN_ZONE: (idType: string, id: string) => `/zone-port-insights/v1/vessels-in-zone-or-port/${idType}/${id}`,
    },
  },
  TOKEN_EXPIRY_MS: 60 * 60 * 1000, // 1 hour in milliseconds
  TOKEN_REFRESH_BUFFER_MS: 5 * 60 * 1000, // Refresh 5 minutes before expiry
};
