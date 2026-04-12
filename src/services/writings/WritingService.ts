import { writeContentFile } from '../../utils/infra/fileOperator';
import { ContentReader } from '../../utils/infra/contentReader';

export const WritingService = {
  /**
   * Creates a new poem entry file on disk.
   *
   * @param params - Validated poem data from the createPoem action
   * @returns {{ id: string, success: boolean }}
   * @throws {Error} if the slug already exists
   */
  async createPoem(params: {
    slug: string;
    title: string;
    form?: string;
    themes?: string[];
    status?: string;
    writtenAt?: string;
    set?: string;
    body?: string;
  }) {
    const { slug, body, ...data } = params;

    // Guard: reject duplicate slugs
    const exists = await ContentReader.exists('poems', slug);
    if (exists) {
      throw new Error(`Poem slug "${slug}" already exists in poems collection.`);
    }

    // Validate optional references
    if (data.set) {
      const setExists = await ContentReader.exists('sets', data.set);
      if (!setExists) {
        throw new Error(`Set "${data.set}" does not exist in sets collection.`);
      }
    }

    if (data.themes && data.themes.length > 0) {
      for (const themeSlug of data.themes) {
        const themeExists = await ContentReader.exists('themes', themeSlug);
        if (!themeExists) {
          throw new Error(`Theme "${themeSlug}" does not exist in themes collection.`);
        }
      }
    }

    // Strip undefined values so YAML serialisation doesn't write null keys
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );

    // Write to disk — the SSR page will pick this up on next request
    const result = await writeContentFile({
      collection: 'poems',
      slug,
      data: cleanData,
      body: body ?? '',
    });

    return { id: result.slug, success: true };
  },

  /**
   * Creates a new short story entry file on disk.
   *
   * @param params - Validated short story data from the createShortStory action
   * @returns {{ id: string, success: boolean }}
   * @throws {Error} if the slug already exists
   */
  async createShortStory(params: {
    slug: string;
    title: string;
    set?: string;
    companionProject?: string;
    wordCount?: number;
    themes?: string[];
    status?: string;
    writtenAt?: string;
    body?: string;
  }) {
    const { slug, body, ...data } = params;

    // Guard: reject duplicate slugs
    const exists = await ContentReader.exists('short-stories', slug);
    if (exists) {
      throw new Error(`Short story slug "${slug}" already exists in short-stories collection.`);
    }

    // Validate optional references
    if (data.set) {
      const setExists = await ContentReader.exists('sets', data.set);
      if (!setExists) {
        throw new Error(`Set "${data.set}" does not exist in sets collection.`);
      }
    }

    if (data.companionProject) {
      const projectExists = await ContentReader.exists('projects', data.companionProject);
      if (!projectExists) {
        throw new Error(`Project "${data.companionProject}" does not exist in projects collection.`);
      }
    }

    if (data.themes && data.themes.length > 0) {
      for (const themeSlug of data.themes) {
        const themeExists = await ContentReader.exists('themes', themeSlug);
        if (!themeExists) {
          throw new Error(`Theme "${themeSlug}" does not exist in themes collection.`);
        }
      }
    }

    // Strip undefined values so YAML serialisation doesn't write null keys
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );

    // Write to disk — SSR page will pick this up on next request
    const result = await writeContentFile({
      collection: 'short-stories',
      slug,
      data: cleanData,
      body: body ?? '',
    });

    return { id: result.slug, success: true };
  },

  /**
   * Creates a new dream entry file on disk.
   *
   * @param params - Validated dream data from the createDream action
   * @returns {{ id: string, success: boolean }}
   * @throws {Error} if the slug already exists
   */
  async createDream(params: {
    slug: string;
    title: string;
    set?: string;
    companionProject?: string;
    wordCount?: number;
    themes?: string[];
    status?: string;
    writtenAt?: string;
    body?: string;
  }) {
    const { slug, body, ...data } = params;

    // Guard: reject duplicate slugs
    const exists = await ContentReader.exists('dreams' as any, slug);
    if (exists) {
      throw new Error(`Dream slug "${slug}" already exists in dreams collection.`);
    }

    // Validate optional references
    if (data.set) {
      const setExists = await ContentReader.exists('sets', data.set);
      if (!setExists) {
        throw new Error(`Set "${data.set}" does not exist in sets collection.`);
      }
    }

    if (data.companionProject) {
      const projectExists = await ContentReader.exists('projects', data.companionProject);
      if (!projectExists) {
        throw new Error(`Project "${data.companionProject}" does not exist in projects collection.`);
      }
    }

    if (data.themes && data.themes.length > 0) {
      for (const themeSlug of data.themes) {
        const themeExists = await ContentReader.exists('themes', themeSlug);
        if (!themeExists) {
          throw new Error(`Theme "${themeSlug}" does not exist in themes collection.`);
        }
      }
    }

    // Strip undefined values so YAML serialisation doesn't write null keys
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );

    // Write to disk — the SSR page will pick this up on next request
    const result = await writeContentFile({
      collection: 'dreams',
      slug,
      data: cleanData,
      body: body ?? '',
    });

    return { id: result.slug, success: true };
  },
};
