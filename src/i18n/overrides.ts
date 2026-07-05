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
    "Band": "Formație",
    "Bands": "Formații",
    "band": "formație",
    "bands": "formații",
    "Trupă": "Formație",
    "Trupe": "Formații",
    "Instrumentalist": "Instrumentist",
    "Instrumentalists": "Instrumentiști",
    "instrumentalist": "instrumentist",
    "instrumentalists": "instrumentiști",
    "Promotion": "Promovare",
    "Promotions": "Promovări",
    "promotion": "promovare",
    "promotions": "promovări",
    // Brand-name protection — never allow "Musicalist" / "Muzikalist" variants.
    "Musicalist": "Muzicalist",
    "MUSICALIST": "MUZICALIST",
    "Muzikalist": "Muzicalist",
    "Musikalist": "Muzicalist",
  },
};

export const getOverride = (lang: string, text: string): string | undefined => {
  const base = (lang || '').split('-')[0].toLowerCase();
  return TRANSLATION_OVERRIDES[base]?.[text];
};
