import type { ActiveTag, CompatLevel, CompatRule, PouchItem } from "@/types";

export interface CompatCard {
  itemA: PouchItem;
  itemB: PouchItem;
  rule: CompatRule;
}

const levelOrder: Record<CompatLevel, number> = { ng: 0, caution: 1, good: 2 };

function findRule(tagsA: ActiveTag[], tagsB: ActiveTag[], compatRules: CompatRule[]): CompatRule | null {
  for (const rule of compatRules) {
    const forward = tagsA.includes(rule.tagA) && tagsB.includes(rule.tagB);
    const backward = tagsA.includes(rule.tagB) && tagsB.includes(rule.tagA);
    if (forward || backward) return rule;
  }
  return null;
}

/** 登録アイテムを総当りで相性ルールと照合し、NG→注意→好相性の順で返す。 */
export function checkPouchCompat(items: PouchItem[], compatRules: CompatRule[]): CompatCard[] {
  const cards: CompatCard[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const rule = findRule(items[i].tags, items[j].tags, compatRules);
      if (rule) {
        cards.push({ itemA: items[i], itemB: items[j], rule });
      }
    }
  }
  return cards.sort((a, b) => levelOrder[a.rule.level] - levelOrder[b.rule.level]);
}

const morningTags: ActiveTag[] = ["uv-filter-chemical", "uv-filter-mineral", "vitaminC-pure", "vitaminC-derivative"];
const nightTags: ActiveTag[] = ["retinol", "aha", "bha"];

export interface Routine {
  morning: PouchItem[];
  night: PouchItem[];
  anytime: PouchItem[];
}

/** 成分タグから朝/夜/いつでものルーティンに自動振り分け。 */
export function buildRoutine(items: PouchItem[]): Routine {
  const routine: Routine = { morning: [], night: [], anytime: [] };
  for (const item of items) {
    const isMorning = item.tags.some((t) => morningTags.includes(t));
    const isNight = item.tags.some((t) => nightTags.includes(t));
    if (isMorning && !isNight) routine.morning.push(item);
    else if (isNight && !isMorning) routine.night.push(item);
    else routine.anytime.push(item);
  }
  return routine;
}
