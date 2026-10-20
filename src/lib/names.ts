/**
 * Polish vocative ("wołacz") for addressing the user by name: Marek → Marku, Piotr → Piotrze,
 * Monika → Moniko. Covers the regular patterns; the result can always be overridden in Settings.
 */
export function vocative(raw: string): string {
  const name = raw.trim();
  if (!name) return name;
  const lower = name.toLowerCase();
  const irregular: Record<string, string> = {
    bóg: "Boże", ojciec: "Ojcze", tomasz: "Tomaszu", paweł: "Pawle", michał: "Michale", rafał: "Rafale",
    karol: "Karolu", piotr: "Piotrze", aleksander: "Aleksandrze", kacper: "Kacprze", ksawery: "Ksawery",
    jerzy: "Jerzy", antoni: "Antoni", leon: "Leonie", jan: "Janie", adam: "Adamie", marcin: "Marcinie",
  };
  if (irregular[lower]) return irregular[lower];
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const stem = (n: number) => name.slice(0, name.length - n);
  if (/ek$/i.test(name)) return cap(stem(2) + "ku"); // Marek, Tomek, Jacek
  if (/(ia|ja)$/i.test(name)) return cap(stem(1) + "o"); // Julia → Julio
  if (/a$/i.test(name)) return cap(stem(1) + "o"); // Monika → Moniko, Gaja → Gajo, Kuba → Kubo
  if (/(i|y)$/i.test(name)) return name; // Antoni, Jerzy
  if (/(sz|cz|rz|ż|j|k|g|ch|l|h)$/i.test(name)) return name + "u"; // Łukasz, Andrzej, Karol
  if (/ł$/i.test(name)) return stem(1) + "le";
  if (/r$/i.test(name)) return name + "ze";
  if (/t$/i.test(name)) return stem(1) + "cie";
  if (/d$/i.test(name)) return stem(1) + "dzie";
  if (/s$/i.test(name)) return stem(1) + "sie";
  if (/z$/i.test(name)) return stem(1) + "zie";
  if (/(n|m|f|w|b|p|c)$/i.test(name)) return name + "ie";
  return name;
}

export interface NameForms {
  /** mianownik — "Marek" */
  nom: string;
  /** wołacz — "Marku" */
  voc: string;
}

export function nameForms(name: string, vocOverride?: string): NameForms {
  const nom = name.trim() || "Marek";
  return { nom, voc: vocOverride?.trim() || vocative(nom) };
}

/**
 * Script placeholders: {imię} / {name} → wołacz (forma do zwracania się: "Marku"),
 * {imię_m} / {name_nom} → mianownik ("Marek").
 */
export function fillName(text: string, forms: NameForms): string {
  return text
    .replace(/\{(imię_m|imie_m|name_nom)\}/g, forms.nom)
    .replace(/\{(imię|imie|name)\}/g, forms.voc);
}
