import { apiJson } from "./client";

export interface Model {
  id: string;
  object: string;
  owned_by?: string;
  created?: number;
}

interface ModelList {
  object: "list";
  data: Model[];
}

export async function listModels(): Promise<Model[]> {
  const res = await apiJson<ModelList>("/v1/models");
  return res.data ?? [];
}
