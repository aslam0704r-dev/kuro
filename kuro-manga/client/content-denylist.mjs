// Deployment-owner moderation only. Add canonical IDs here to quarantine a
// mislabelled title/chapter/provider, then build and redeploy the whole source.
// Entries can only deny content; they never relax required rating evidence.
export const blockedMangaIds=Object.freeze([]); // e.g. mangadex-<UUID>, anilist-<number>
export const blockedChapterIds=Object.freeze([]); // e.g. mangadex:<UUID>
export const blockedProviderIds=Object.freeze([]);
