import { apiJson } from "./client";

export interface HealthResponse {
  status: string;
  edition: string;
  version: string;
  agents: number;
}

export function getHealth(): Promise<HealthResponse> {
  return apiJson<HealthResponse>("/healthz?format=json", { anonymous: true });
}
