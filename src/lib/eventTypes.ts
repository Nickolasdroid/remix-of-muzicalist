// Common live music event types
export const EVENT_TYPES = [
  "Wedding",
  "Engagement",
  "Baptism",
  "Funeral",
  "Birthday Party",
  "18th Birthday",
  "Anniversary",
  "Graduation",
  "Prom",
  "Bachelor / Bachelorette Party",
  "Corporate Event",
  "Conference",
  "Product Launch",
  "Gala / Award Ceremony",
  "Charity / Fundraiser",
  "Private Party",
  "House Party",
  "Restaurant / Bar",
  "Club / Nightclub",
  "Concert",
  "Festival",
  "Cultural Event",
  "Religious Service",
  "School Event",
  "Holiday / Christmas Party",
  "New Year's Eve",
  "Easter Event",
  "Fashion Show",
  "Wine / Beer Tasting",
  "Cruise / Yacht Party",
  "Hotel / Resort Event",
  "Brand Activation",
  "TV / Film Production",
  "Studio Recording",
  "Other",
] as const;

export type EventType = typeof EVENT_TYPES[number];

/** Shown first in pickers: the events most often booked on Muzicalist */
export const COMMON_EVENT_TYPES: EventType[] = [
  "Wedding",
  "Baptism",
  "18th Birthday",
  "Birthday Party",
  "Corporate Event",
  "Private Party",
];

export const isKnownEventType = (t?: string | null): t is EventType =>
  !!t && (EVENT_TYPES as readonly string[]).includes(t);

/**
 * Romanian labels for generated documents (contracts, confirmations), which are not
 * passed through the page translator. The UI itself translates the English keys.
 */
export const EVENT_TYPE_RO: Record<EventType, string> = {
  "Wedding": "Nuntă",
  "Engagement": "Logodnă",
  "Baptism": "Botez",
  "Funeral": "Înmormântare",
  "Birthday Party": "Petrecere aniversară",
  "18th Birthday": "Majorat",
  "Anniversary": "Aniversare",
  "Graduation": "Absolvire",
  "Prom": "Bal de absolvire",
  "Bachelor / Bachelorette Party": "Petrecerea burlacilor / burlăcițelor",
  "Corporate Event": "Eveniment corporate",
  "Conference": "Conferință",
  "Product Launch": "Lansare de produs",
  "Gala / Award Ceremony": "Gală / Ceremonie de premiere",
  "Charity / Fundraiser": "Caritate / Strângere de fonduri",
  "Private Party": "Petrecere privată",
  "House Party": "Petrecere acasă",
  "Restaurant / Bar": "Restaurant / Bar",
  "Club / Nightclub": "Club / Club de noapte",
  "Concert": "Concert",
  "Festival": "Festival",
  "Cultural Event": "Eveniment cultural",
  "Religious Service": "Serviciu religios",
  "School Event": "Eveniment școlar",
  "Holiday / Christmas Party": "Petrecere de sărbători / Crăciun",
  "New Year's Eve": "Revelion",
  "Easter Event": "Eveniment de Paște",
  "Fashion Show": "Prezentare de modă",
  "Wine / Beer Tasting": "Degustare de vin / bere",
  "Cruise / Yacht Party": "Croazieră / Petrecere pe iaht",
  "Hotel / Resort Event": "Eveniment la hotel / resort",
  "Brand Activation": "Activare de brand",
  "TV / Film Production": "Producție TV / Film",
  "Studio Recording": "Înregistrare în studio",
  "Other": "Altele",
};

/** Event type as Romanian text for documents; free text is returned as typed. */
export const eventTypeRo = (t?: string | null) => (t ? (isKnownEventType(t) ? EVENT_TYPE_RO[t] : t) : "");
