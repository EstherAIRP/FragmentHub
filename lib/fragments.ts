import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { fragmentSchema, type Fragment } from "@/lib/fragment-schema";

const fragmentDirectory = path.join(process.cwd(), "data", "fragments");

export async function listFragments(): Promise<Fragment[]> {
  let entries: string[];

  try {
    entries = await fs.readdir(fragmentDirectory);
  } catch {
    return [];
  }

  const files = entries.filter((name) => name.endsWith(".json"));

  const fragments = await Promise.all(
    files.map(async (fileName) => {
      const filePath = path.join(fragmentDirectory, fileName);
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw);
      return fragmentSchema.parse(parsed);
    }),
  );

  return fragments.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
