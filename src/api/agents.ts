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
  // Try control RPC first, fall back to the OpenAI-compat /v1/agents alias
  // some builds expose. Whichever returns first wins.
  try {
    const res = await apiJson<AgentListShape | Agent[]>("/control/v0/agents");
    return normalize(res);
  } catch {
    const res = await apiJson<AgentListShape | Agent[]>("/v1/agents");
    return normalize(res);
  }
}

function normalize(res: AgentListShape | Agent[]): Agent[] {
  if (Array.isArray(res)) return res;
  return res.agents ?? res.data ?? res.items ?? [];
}
