import "server-only";

import type { Fragment } from "@/lib/fragment-schema";
import {
  getLocalFragment,
  listLocalFragments,
} from "@/lib/fragments/local-store";

export async function listFragments(): Promise<Fragment[]> {
  return listLocalFragments();
}

export async function getFragment(id: string): Promise<Fragment | null> {
  return getLocalFragment(id);
}
