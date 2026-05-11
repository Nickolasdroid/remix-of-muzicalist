// Manual translation overrides that take precedence over AI auto-translations.
// Keys are normalized language codes; values map source English text -> desired translation.
export const TRANSLATION_OVERRIDES: Record<string, Record<string, string>> = {
  ro: {
    "Singer": "Solist",
    "Singers": "Soliști",
    "singer": "solist",
    "singers": "soliști",
    "Cântăreț": "Solist",
    "Cântăreață": "Solist",
    "Cântăreți": "Soliști",
    "Cântărețe": "Soliști",
  },
};

export const getOverride = (lang: string, text: string): string | undefined => {
  const base = (lang || '').split('-')[0].toLowerCase();
  return TRANSLATION_OVERRIDES[base]?.[text];
};
