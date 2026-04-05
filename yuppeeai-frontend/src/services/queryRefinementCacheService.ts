const STORAGE_KEY = "yuppee:query-refinement-cache";

type QueryRefinementCache = Record<string, string[]>;

function readCache(): QueryRefinementCache {
  const rawCache = window.localStorage.getItem(STORAGE_KEY);
  if (!rawCache) {
    return {};
  }

  try {
    const parsedCache = JSON.parse(rawCache) as unknown;
    if (!parsedCache || typeof parsedCache !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsedCache).filter(
        ([query, instructions]) =>
          typeof query === "string" &&
          Array.isArray(instructions) &&
          instructions.every((instruction) => typeof instruction === "string"),
      ),
    );
  } catch (error) {
    console.warn("[QueryRefinementCache] Failed to parse cache", error);
    return {};
  }
}

function save(query: string, instructions: string[]) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return;
  }

  const cache = readCache();
  cache[trimmedQuery] = [...instructions];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

function load(query: string): string[] | null {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return null;
  }

  const cache = readCache();
  const instructions = cache[trimmedQuery];
  if (!instructions) {
    return null;
  }

  return [...instructions];
}

export const queryRefinementCacheService = {
  load,
  save,
};

export { load, save };
