import { getCollection, getEntry, type CollectionKey } from 'astro:content';

/**
 * Infrastructure wrapper for Astro's SSR content layer.
 *
 * Centralises all content queries so Services have a single
 * point of access. Note: only valid within Astro's SSR context
 * (API routes, server-rendered pages). Not usable in standalone
 * Node scripts or outside the Astro runtime.
 *
 * @module contentReader
 */
export const ContentReader = {
  /**
   * Checks for the existence of an entry.
   * NOTE: With the glob() loader, the ID is the file path relative to the collection
   * folder without the extension (e.g., 'minuet/john-lennon').
   */
  async exists(collection: CollectionKey, id: string): Promise<boolean> {
    try {
      const entry = await getEntry(collection, id);
      return !!entry;
    } catch (e) {
      return false;
    }
  },

  async list(collection: CollectionKey) {
    return await getCollection(collection);
  },

  async getOne(collection: CollectionKey, id: string) {
    return await getEntry(collection, id);
  }
};