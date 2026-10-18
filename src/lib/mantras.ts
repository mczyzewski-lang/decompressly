import type { Mantra, MantraCategory } from "./types";
import { hashString } from "./dates";

export const MANTRA_CATEGORIES: { id: MantraCategory; label: string }[] = [
  { id: "odpuszczanie", label: "Odpuszczanie" },
  { id: "ekscytacja", label: "Ekscytacja" },
  { id: "fomo", label: "FOMO" },
  { id: "rodzina", label: "Rodzina" },
  { id: "regeneracja", label: "Regeneracja" },
  { id: "obecnosc", label: "Obecność" },
  { id: "satysfakcja", label: "Satysfakcja" },
  { id: "zakonczenie", label: "Zakończenie pracy" },
];

const raw: [MantraCategory, string][] = [
  // Odpuszczanie
  ["odpuszczanie", "Nie każda możliwość wymaga realizacji."],
  ["odpuszczanie", "To, że coś mogę zrobić, nie oznacza, że muszę."],
  ["odpuszczanie", "Nie każda myśl wymaga działania."],
  ["odpuszczanie", "Spokój nie jest kolejnym projektem do wykonania."],
  ["odpuszczanie", "Mogę odłożyć to na później i nic nie stracę."],
  ["odpuszczanie", "Nie muszę dziś niczego rozwiązywać do końca."],
  ["odpuszczanie", "Wystarczy, że zrobię mniej i zrobię to spokojnie."],
  ["odpuszczanie", "Mogę puścić tę sprawę na kilka godzin. Ona poczeka."],
  // Ekscytacja
  ["ekscytacja", "Mogę odczuwać ekscytację i nie podejmować działania."],
  ["ekscytacja", "Dobry pomysł przetrwa jedną noc snu."],
  ["ekscytacja", "Ekscytacja to energia, nie polecenie."],
  ["ekscytacja", "Mogę zapisać pomysł i wrócić do swojego dnia."],
  ["ekscytacja", "Nie muszę dzisiaj budować kolejnego miasta."],
  ["ekscytacja", "Mogę być ambitny i spokojny jednocześnie."],
  ["ekscytacja", "Ciekawość może poczekać, aż sam ją zaproszę."],
  ["ekscytacja", "Najlepsze pomysły lubią dojrzewać w spokoju."],
  // FOMO
  ["fomo", "Moja kreatywność nie zniknie przez miesiąc odpoczynku."],
  ["fomo", "Nie potrzebuję kolejnego projektu, żeby mój dzień był wartościowy."],
  ["fomo", "Nie muszę zarabiać każdą godziną swojego życia."],
  ["fomo", "Okazje wracają. Ten dzień nie wróci."],
  ["fomo", "Nie przegapiam niczego, kiedy jestem tutaj."],
  ["fomo", "Moje możliwości nie znikają, kiedy odpoczywam."],
  ["fomo", "Świat może pędzić. Ja mogę iść spacerem."],
  ["fomo", "Nie wszystko, co ciekawe, jest dla mnie na teraz."],
  // Rodzina
  ["rodzina", "Moja rodzina nie jest przerwą od życia. Jest jego częścią."],
  ["rodzina", "Leon nie będzie drugi raz w tym wieku."],
  ["rodzina", "Gaja zapamięta, że byłem obok."],
  ["rodzina", "Wieczór z Moniką jest ważniejszy niż kolejna funkcja."],
  ["rodzina", "Najważniejsze rzeczy dzieją się przy wspólnym stole."],
  ["rodzina", "Mogę słuchać, nie myśląc o tym, co zrobię potem."],
  ["rodzina", "Obecność jest najlepszym, co dziś mogę dać."],
  ["rodzina", "Dom nie potrzebuje mojej produktywności. Potrzebuje mnie."],
  // Regeneracja
  ["regeneracja", "Odpoczynek nie wymaga wcześniejszego sukcesu."],
  ["regeneracja", "Nie muszę czekać na wyczerpanie, żeby odpocząć."],
  ["regeneracja", "Ciało odpoczywa we własnym tempie. Nie muszę go poganiać."],
  ["regeneracja", "Sen jest częścią mojej pracy, nie jej przeciwieństwem."],
  ["regeneracja", "Mogę zwolnić, zanim ktoś mi każe."],
  ["regeneracja", "Wolniejszy dzień też jest dobrym dniem."],
  ["regeneracja", "Mogę po prostu leżeć i niczego nie poprawiać."],
  ["regeneracja", "Odpoczynek się nie zużywa. Mogę go mieć więcej."],
  // Obecność
  ["obecnosc", "Dzisiaj możesz po prostu żyć."],
  ["obecnosc", "Jestem tutaj. To wystarczy."],
  ["obecnosc", "Ta chwila nie potrzebuje ulepszenia."],
  ["obecnosc", "Mogę poczuć słońce, zanim pomyślę o planie."],
  ["obecnosc", "Oddech dzieje się sam. Mogę mu tylko towarzyszyć."],
  ["obecnosc", "Nie muszę sprawdzać, czy już jestem spokojny."],
  ["obecnosc", "Kawa smakuje lepiej, kiedy jej nie poganiam."],
  ["obecnosc", "Mogę patrzeć, nie analizując."],
  // Satysfakcja
  ["satysfakcja", "Mam prawo cieszyć się tym, co już zbudowałem."],
  ["satysfakcja", "Enjoy what you've built."],
  ["satysfakcja", "To, co zrobiłem, już się wydarzyło. Mogę to docenić."],
  ["satysfakcja", "Wystarczająco dobrze to naprawdę dobrze."],
  ["satysfakcja", "Przeszedłem długą drogę. Mogę na chwilę usiąść."],
  ["satysfakcja", "Nie muszę od razu podnosić poprzeczki."],
  ["satysfakcja", "Spokój to też osiągnięcie, którego nie trzeba mierzyć."],
  ["satysfakcja", "Mogę być dumny bez planowania następnego kroku."],
  // Zakończenie pracy
  ["zakonczenie", "Na dzisiaj wystarczy."],
  ["zakonczenie", "Zamknięty laptop to otwarte popołudnie."],
  ["zakonczenie", "Niedokończone sprawy poczekają do jutra. Zapisałem je."],
  ["zakonczenie", "Wojna się skończyła. Mogę wrócić do domu."],
  ["zakonczenie", "Praca ma swój koniec. Dzień trwa dalej."],
  ["zakonczenie", "You don't have to build another city today."],
  ["zakonczenie", "Jutro też będzie czas na dobre decyzje."],
  ["zakonczenie", "Kończę nie dlatego, że wszystko zrobiłem, ale dlatego, że tak wybieram."],
];

export const MANTRAS: Mantra[] = raw.map(([category, text], i) => ({
  id: `m${String(i + 1).padStart(2, "0")}`,
  category,
  text,
}));

export const MANDATORY_MANTRAS = [
  "Nie każda możliwość wymaga realizacji.",
  "Nie muszę dzisiaj budować kolejnego miasta.",
  "Moja kreatywność nie zniknie przez miesiąc odpoczynku.",
  "To, że coś mogę zrobić, nie oznacza, że muszę.",
  "Mogę być ambitny i spokojny jednocześnie.",
  "Odpoczynek nie wymaga wcześniejszego sukcesu.",
  "Nie potrzebuję kolejnego projektu, żeby mój dzień był wartościowy.",
  "Nie każda myśl wymaga działania.",
  "Nie muszę czekać na wyczerpanie, żeby odpocząć.",
  "Mam prawo cieszyć się tym, co już zbudowałem.",
  "Spokój nie jest kolejnym projektem do wykonania.",
  "Mogę odczuwać ekscytację i nie podejmować działania.",
  "Moja rodzina nie jest przerwą od życia. Jest jego częścią.",
  "Leon nie będzie drugi raz w tym wieku.",
  "Nie muszę zarabiać każdą godziną swojego życia.",
  "Na dzisiaj wystarczy.",
];

export function allMantras(custom: Mantra[]): Mantra[] {
  return [...MANTRAS, ...custom];
}

/** Stable "random" mantra for a date. Pinned / chosen-for-today wins. */
export function mantraForDate(
  date: string,
  opts: { custom: Mantra[]; pinned?: string; override?: { date: string; id: string }; salt?: string },
): Mantra {
  const list = allMantras(opts.custom);
  const find = (id?: string) => (id ? list.find((m) => m.id === id) : undefined);
  if (opts.override?.date === date) {
    const m = find(opts.override.id);
    if (m) return m;
  }
  const pinned = find(opts.pinned);
  if (pinned && !opts.salt) return pinned;
  const idx = hashString(date + (opts.salt ?? "")) % list.length;
  return list[idx];
}
