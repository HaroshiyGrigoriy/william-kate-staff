import { MODULE_VERSION, scenes } from "./content.ts";
export const STORAGE_KEY = "wk-academy:first-shift:v1";
export type Decision = { scene: string; node: string; choice: string };
export type Progress = {
  version: number;
  decisions: Decision[];
  acknowledged: number;
};
export const fresh = (): Progress => ({
  version: MODULE_VERSION,
  decisions: [],
  acknowledged: 0,
});
export function position(p: Progress) {
  let index = 0;
  let nodeId = "start";
  for (const d of p.decisions) {
    const scene = scenes[index];
    const choice = scene?.nodes
      .find((n) => n.id === nodeId)
      ?.choices.find((c) => c.id === d.choice);
    if (!scene || d.scene !== scene.id || d.node !== nodeId || !choice)
      throw new Error("Invalid learning path");
    if (choice.next) nodeId = choice.next;
    else {
      index++;
      nodeId = "start";
    }
  }
  return { index, nodeId, complete: index === scenes.length };
}
export function parseProgress(raw: string | null): Progress {
  if (!raw) return fresh();
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object") throw new Error("Invalid progress");
  const p = value as Progress;
  if (
    p.version !== MODULE_VERSION ||
    !Array.isArray(p.decisions) ||
    p.decisions.length > 10 ||
    !Number.isInteger(p.acknowledged) ||
    p.acknowledged < 0 ||
    p.acknowledged > p.decisions.length ||
    p.decisions.length - p.acknowledged > 1
  )
    throw new Error("Invalid progress");
  for (const d of p.decisions)
    if (
      !d ||
      typeof d !== "object" ||
      typeof d.scene !== "string" ||
      typeof d.node !== "string" ||
      typeof d.choice !== "string"
    )
      throw new Error("Invalid decision");
  position(p);
  return {
    version: MODULE_VERSION,
    decisions: p.decisions.map(({ scene, node, choice }) => ({
      scene,
      node,
      choice,
    })),
    acknowledged: p.acknowledged,
  };
}
export function decide(p: Progress, choiceId: string): Progress {
  if (p.acknowledged !== p.decisions.length) return p;
  const { index, nodeId, complete } = position(p);
  if (complete) return p;
  const scene = scenes[index];
  if (
    !scene.nodes
      .find((n) => n.id === nodeId)
      ?.choices.some((c) => c.id === choiceId)
  )
    return p;
  return {
    ...p,
    decisions: [
      ...p.decisions,
      { scene: scene.id, node: nodeId, choice: choiceId },
    ],
  };
}
export function acknowledge(p: Progress): Progress {
  return { ...p, acknowledged: p.decisions.length };
}
export function detail(d: Decision) {
  const scene = scenes.find((s) => s.id === d.scene)!;
  const node = scene.nodes.find((n) => n.id === d.node)!;
  return { scene, node, choice: node.choices.find((c) => c.id === d.choice)! };
}
export function completedScenes(p: Progress) {
  return position({ ...p, decisions: p.decisions.slice(0, p.acknowledged) })
    .index;
}
