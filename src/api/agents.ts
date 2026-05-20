import { apiJson } from "./client";

export interface Agent {
  id: string;
  slug: string;
  description?: string;
  model?: string;
  // Tolerate extra unknown fields without losing them.
  [key: string]: unknown;
}

interface AgentListShape {
  agents?: Agent[];
  data?: Agent[];
  items?: Agent[];
}

export async function listAgents(): Promise<Agent[]> {
  // Studio is served from the data plane (:7474), so fetch must be same-
  // origin. The control RPC at :7475 is loopback-only and unreachable
  // from the browser; the old /control/v0/agents path was returning the
  // SPA fallback HTML and tripping JSON.parse. GET /v1/agents is the
  // SoyaOS-superset data-plane endpoint that returns the same kernel
  // agent list with descriptions (see pkg/openaicompat.handleAgentList).
  const res = await apiJson<AgentListShape | Agent[]>("/v1/agents");
  return normalize(res);
}

function normalize(res: AgentListShape | Agent[]): Agent[] {
  if (Array.isArray(res)) return res;
  return res.agents ?? res.data ?? res.items ?? [];
}
