type ApiEnvironment = {
  VITE_API_URL?: string;
  VITE_BACKEND_URL?: string;
};

export function resolveApiUrl(environment: ApiEnvironment): string {
  return environment.VITE_BACKEND_URL ?? environment.VITE_API_URL ?? "";
}

export const apiUrl = resolveApiUrl({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
});
