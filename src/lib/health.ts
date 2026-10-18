export interface HealthCategory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tips: string[];
  action: { label: string; route: string };
}

/**
 * Practical, conservative guidance aligned with mainstream sleep-, exercise- and stress-research
 * recommendations. Not medical advice; nothing here diagnoses or treats anything.
 */
export const HEALTH: HealthCategory[] = [
  {
    id: "sleep",
    title: "Sleep",
    subtitle: "Sen, regularność, odpoczynek",
    description:
      "Sen to najsilniejsze naturalne narzędzie regeneracji. Dorośli zwykle potrzebują 7–9 godzin. Równie ważna jak długość jest regularność — podobne godziny zasypiania i wstawania, także w weekendy.",
    tips: [
      "Stała pora wstawania pomaga bardziej niż „odsypianie” w weekend.",
      "Ostatnia godzina przed snem: przyciemnione światło, mniej ekranów, mniej pracy poznawczej.",
      "Chłodna, ciemna i cicha sypialnia ułatwia zasypianie.",
      "Poranne światło dzienne (kilka–kilkanaście minut na zewnątrz) wspiera rytm dobowy.",
      "Jeśli nie możesz zasnąć przez dłuższy czas, wstań na chwilę i wróć, gdy poczujesz senność.",
    ],
    action: { label: "Wieczorne odpuszczanie · 10 min", route: "audio/evening" },
  },
  {
    id: "movement",
    title: "Movement",
    subtitle: "Spacery, siłownia, spokojny ruch",
    description:
      "Regularna aktywność fizyczna wspiera nastrój, sen i odporność na stres. Zalecenia WHO dla dorosłych to ok. 150–300 minut umiarkowanego ruchu tygodniowo i ćwiczenia siłowe 2 razy w tygodniu. Spacer też się liczy.",
    tips: [
      "Spacer po zamknięciu pracy to dobry „bufor” między pracą a domem.",
      "Intensywny trening lepiej planować wcześniej niż tuż przed snem, jeśli utrudnia Ci zasypianie.",
      "W okresach dużego zmęczenia łagodny ruch bywa lepszy niż ambitny plan treningowy.",
      "Krótkie przerwy na wstanie od biurka co godzinę są wartościowe same w sobie.",
    ],
    action: { label: "Spacer bez celu", route: "nothing?kind=walk" },
  },
  {
    id: "breath",
    title: "Breath",
    subtitle: "Spokojne oddychanie i relaksacja",
    description:
      "Spokojny oddech z nieco dłuższym wydechem to prosty sposób, by dać ciału sygnał zwolnienia. Nie chodzi o „idealną technikę” ani o głębokie oddychanie na siłę — tylko o wygodne, wolniejsze tempo.",
    tips: [
      "Kilka minut wolniejszego oddechu (np. 4 s wdech, 6 s wydech) wystarczy.",
      "Unikaj hiperwentylacji i długiego wstrzymywania oddechu.",
      "Jeśli pojawią się zawroty głowy, wróć do naturalnego oddechu.",
      "Relaksacja mięśni (np. Jacobsona) to dobra alternatywa, gdy skupianie się na oddechu nie pomaga.",
    ],
    action: { label: "Spokojny oddech · 5 min", route: "breath?min=5&mode=calm" },
  },
  {
    id: "downshift",
    title: "Downshift",
    subtitle: "Kończenie pracy, mniej bodźców",
    description:
      "Wyraźny koniec dnia pracy pomaga głowie przestać „przetwarzać w tle”. Badania nad regeneracją po pracy wskazują, że psychologiczne odłączenie od pracy wiąże się z lepszym samopoczuciem i snem.",
    tips: [
      "Spisanie niedomkniętych spraw na jutro zmniejsza ich „krążenie” w głowie.",
      "Rytuał zamknięcia (ten sam dźwięk, ten sam napój) staje się z czasem sygnałem dla ciała.",
      "Powiadomienia służbowe po pracy: wyciszone albo w trybie skupienia.",
      "Po intensywnym dniu daj sobie 15–30 minut bez nowych bodźców przed wejściem w rodzinne obowiązki.",
    ],
    action: { label: "Rytuał CLOSE", route: "close" },
  },
  {
    id: "mindset",
    title: "Mindset",
    subtitle: "Odpuszczanie, obecność, akceptacja myśli",
    description:
      "Nie każda myśl wymaga działania. Podejścia oparte na uważności i akceptacji uczą zauważania myśli i emocji bez natychmiastowego reagowania. To umiejętność, która rośnie z praktyką, a nie stan do osiągnięcia.",
    tips: [
      "Zapisanie pomysłu jednym zdaniem często wystarczy, by przestał domagać się uwagi.",
      "Ekscytacja i napięcie mogą być obecne — nie musisz ich natychmiast usuwać ani realizować.",
      "Zamiast „muszę” spróbuj „mogę” i sprawdź, czy wybór się zmienia.",
      "Docenianie tego, co już jest, to przeciwwaga dla ciągłego szukania kolejnej możliwości.",
    ],
    action: { label: "Odpuść", route: "letgo" },
  },
  {
    id: "connection",
    title: "Connection",
    subtitle: "Monika, Leon, Gaja, przyjaciele",
    description:
      "Bliskie relacje należą do najlepiej udokumentowanych czynników dobrostanu w długim okresie. Liczy się nie ilość czasu, tylko jakość uwagi — obecność bez telefonu i bez planowania kolejnego kroku.",
    tips: [
      "Jedna aktywność dziennie, w której program ustalają dzieci.",
      "Wieczór z Moniką bez rozmów o pracy — choćby godzina.",
      "Regularny kontakt z przyjaciółmi poza kontekstem biznesu.",
      "Telefon w innym pokoju podczas wspólnych posiłków.",
    ],
    action: { label: "Zaplanuj czas z rodziną", route: "history" },
  },
  {
    id: "stimulation",
    title: "Stimulation",
    subtitle: "Kofeina, ekran, intensywna praca poznawcza",
    description:
      "Kofeina, ekrany i intensywna praca poznawcza są w porządku — ale działają pobudzająco. Kofeina ma okres półtrwania kilku godzin, więc popołudniowa kawa może wpływać na sen, nawet jeśli nie czujesz jej działania.",
    tips: [
      "Ostatnia kawa najlepiej przed wczesnym popołudniem, jeśli zauważasz problemy ze snem.",
      "Wieczorem wybieraj mniej angażujące treści niż kodowanie czy nowe projekty.",
      "Wyciszenie powiadomień to najprostszy sposób na mniej bodźców.",
      "Programowanie dla przyjemności też jest pracą poznawczą — zauważ, czy wieczorem Cię wycisza, czy nakręca.",
    ],
    action: { label: "Czas bez planowania · 5 min", route: "nothing?min=5" },
  },
];

export const HEALTH_DISCLAIMER =
  "Decompressly wspiera nawyki i dobrostan. Nie jest wyrobem medycznym i nie diagnozuje ani nie leczy żadnych zaburzeń, w tym zaburzeń lękowych. Wskaźniki takie jak HRV z zegarków są orientacyjne — zależą od snu, wysiłku, alkoholu czy choroby i nie są dokładnym miernikiem regeneracji psychicznej. Aplikacja nie obiecuje zmian poziomu hormonów (np. DHEA-S, prolaktyny czy testosteronu). W razie niepokojących objawów skontaktuj się z lekarzem.";
