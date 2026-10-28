/** "4 membri" / "20 de membri" / "1 membru" in Romanian, "4 members" in English. */
export const bandMembersLabel = (count: number | string, lang: string): string => {
  const n = Number(count);
  if (!lang.startsWith("ro")) return `${n} ${n === 1 ? "member" : "members"}`;
  if (n === 1) return "1 membru";
  const mod = n % 100;
  return n >= 20 && (mod === 0 || mod >= 20) ? `${n} de membri` : `${n} membri`;
};
