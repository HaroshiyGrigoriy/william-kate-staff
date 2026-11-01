import test from "node:test";
import assert from "node:assert/strict";
import { scenes } from "../src/academy/content.ts";
import {
  acknowledge,
  completedScenes,
  decide,
  fresh,
  parseProgress,
  position,
} from "../src/academy/progress.ts";

test("every possible branch can finish, with feedback acknowledged before completion", () => {
  let finished = 0;
  function walk(p: ReturnType<typeof fresh>) {
    assert.deepEqual(parseProgress(JSON.stringify(p)), p);
    const pos = position(p);
    if (pos.complete) {
      assert.equal(completedScenes(p), 5);
      finished++;
      return;
    }
    const scene = scenes[pos.index];
    const node = scene.nodes.find((n) => n.id === pos.nodeId)!;
    assert.ok(node);
    for (const choice of node.choices) {
      assert.ok(choice.consequence && choice.why);
      const next = decide(p, choice.id);
      assert.equal(next.decisions.length, p.decisions.length + 1);
      assert.deepEqual(
        decide(next, choice.id),
        next,
        "double click cannot answer another node",
      );
      assert.equal(
        completedScenes(next),
        completedScenes(p),
        "unread feedback is not completion",
      );
      walk(acknowledge(next));
    }
  }
  walk(fresh());
  assert.equal(finished, 6 ** 5);
});
test("reloading preserves feedback as well as in-progress position", () => {
  const p = decide(fresh(), "ask");
  const reloaded = parseProgress(JSON.stringify(p));
  assert.equal(reloaded.acknowledged, 0);
  assert.equal(position(reloaded).nodeId, "ready");
  assert.deepEqual(decide(reloaded, "walk"), reloaded);
  const finishedScene = decide(acknowledge(reloaded), "walk");
  assert.equal(completedScenes(finishedScene), 0);
  assert.equal(completedScenes(acknowledge(finishedScene)), 1);
});
test("rejects malformed, wrong-version, skipped, forged and out-of-order saves", () => {
  for (const raw of [
    "{",
    "null",
    "[]",
    "{}",
    JSON.stringify({ ...fresh(), version: 999 }),
    JSON.stringify({ ...fresh(), acknowledged: -1 }),
    JSON.stringify({ ...fresh(), decisions: [null] }),
    JSON.stringify({
      ...fresh(),
      decisions: [{ scene: "welcome", node: "start", choice: "notice" }],
    }),
    JSON.stringify({
      ...fresh(),
      decisions: [{ scene: "team", node: "start", choice: "forged" }],
    }),
    JSON.stringify({
      ...fresh(),
      decisions: [
        { scene: "team", node: "start", choice: "ask" },
        { scene: "team", node: "repair", choice: "clarify" },
      ],
      acknowledged: 2,
    }),
  ])
    assert.throws(() => parseProgress(raw), raw);
  assert.deepEqual(parseProgress(null), fresh());
  assert.deepEqual(decide(fresh(), "not-an-option"), fresh());
});
test("completed module is terminal; reset creates a clean independent session", () => {
  let p = fresh();
  while (!position(p).complete) {
    const { index, nodeId } = position(p);
    const choice = scenes[index].nodes.find((n) => n.id === nodeId)!.choices[0];
    p = acknowledge(decide(p, choice.id));
  }
  assert.deepEqual(decide(p, "ask"), p);
  assert.equal(fresh().decisions.length, 0);
});
