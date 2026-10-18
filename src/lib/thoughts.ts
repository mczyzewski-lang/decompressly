import { hashString } from "./dates";

/**
 * Biblioteka myśli — personal paraphrases from conversations (18.10.2026 and earlier),
 * not verbatim quotes. Every sentence can be edited, favourited or hidden by the user.
 */
export type ThoughtCategory =
  | "demob"
  | "create"
  | "fomo"
  | "family"
  | "parenting"
  | "estepona"
  | "energy"
  | "freedom"
  | "business"
  | "body"
  | "identity"
  | "rituals";

export interface Thought {
  id: string;
  category: ThoughtCategory;
  text: string;
  star?: boolean;
  /** warm reminders about time passing — never shown in decision/pressure contexts */
  gentle?: boolean;
  custom?: boolean;
}

export interface ReflectionQuestion {
  id: string;
  category: ThoughtCategory;
  text: string;
}

export const THOUGHT_CATEGORIES: { id: ThoughtCategory; label: string }[] = [
  { id: "demob", label: "Demobilizacja" },
  { id: "create", label: "Tworzenie a odpoczynek" },
  { id: "fomo", label: "Odpuszczanie i FOMO" },
  { id: "family", label: "Rodzina i obecność" },
  { id: "parenting", label: "Spokojne rodzicielstwo" },
  { id: "estepona", label: "Leżak w Esteponie" },
  { id: "energy", label: "Czas i energia" },
  { id: "freedom", label: "Wolność i bezpieczeństwo" },
  { id: "business", label: "Biznes, prostota i rola foundera" },
  { id: "body", label: "Ciało, pobudzenie i łagodność" },
  { id: "identity", label: "Tożsamość, sens i wdzięczność" },
  { id: "rituals", label: "Rytuały i codzienne decyzje" },
];

export const CATEGORY_LABEL = Object.fromEntries(THOUGHT_CATEGORIES.map((c) => [c.id, c.label])) as Record<ThoughtCategory, string>;

// "★ " marks a key thought, "~ " a gentle one.
const RAW: Record<ThoughtCategory, string[]> = {
  demob: [
    "★ Wojna się skończyła. Nie muszę od razu budować kolejnego miasta.",
    "Przez dziewięć miesięcy byłem w mobilizacji. Teraz mogę pozwolić sobie na demobilizację.",
    "Nie muszę przechodzić od jednego zwycięstwa natychmiast do następnego frontu.",
    "Zanim zacznę nową budowę, mogę nacieszyć się pokojem.",
    "★ Listopad jest eksperymentem z odpoczynkiem, nie egzaminem z dyscypliny.",
    "Pomysły zapisuję. Nowych projektów w listopadzie nie uruchamiam.",
    "Miesiąc bez budowania nowych rzeczy nie odbiera mi ambicji ani umiejętności.",
    "Kończę etap, zanim otworzę następny.",
    "Nie muszę od razu zamieniać odzyskanej przestrzeni w kolejną inicjatywę.",
    "Ważne jest nie tylko zwyciężyć, ale też wrócić do domu.",
    "Nie muszę być w gotowości bojowej, skoro dziś nie trwa żadna wojna.",
    "Kiedy listopadowy plan się potknie, wracam do niego bez kary i bez nadrabiania.",
  ],
  create: [
    "★ Tworzenie sprawia mi prawdziwą frajdę. To nie znaczy, że zawsze mnie regeneruje.",
    "Mogę jednocześnie dobrze się bawić i intensywnie angażować głowę.",
    "Ekscytacja nie jest wrogiem. Nie musi jednak wypełniać każdej wolnej chwili.",
    "Claude Code otwiera nowe możliwości. Nie muszę korzystać z nich wszystkich dzisiaj.",
    "To, że potrafię coś szybko zbudować, nie znaczy, że warto oddać temu mój odpoczynek.",
    "Mogę skończyć sesję pracy nawet wtedy, gdy projekt jest najbardziej interesujący.",
    "Mam prawo przerwać, będąc w środku ekscytującego pomysłu.",
    "Odpoczynek poznawczy i przyjemność tworzenia to różne potrzeby.",
    "Nie muszę nazywać tworzenia czymś złym, żeby czasami wybrać coś spokojniejszego.",
    "Nowa technologia jest fascynująca. Mój wolny czas również ma swoją wartość.",
    "Jeśli jestem chory lub zmęczony, mogę wybrać odpoczynek, nawet gdy mam ochotę budować.",
    "Moje najlepsze projekty nie potrzebują mojej obecności dwadzieścia cztery godziny na dobę.",
  ],
  fomo: [
    "★ Nie każda możliwość wymaga realizacji.",
    "Nie każda myśl zasługuje na działanie.",
    "Mogę czuć ekscytację i nie zrobić z nią niczego.",
    "Dobry pomysł może poczekać. Nie staje się przez to gorszy.",
    "Mam możliwość wyboru, nie obowiązek wykorzystania możliwości.",
    "Zapisanie pomysłu nie jest zobowiązaniem do jego realizacji.",
    "Nie muszę sprawdzać jeszcze jednej rzeczy.",
    "„Tylko jeden prompt” też jest decyzją o wykorzystaniu mojego czasu.",
    "Mogę zostawić coś niedokończonego i nadal mieć dobry dzień.",
    "Nie tracę okazji do życia, gdy rezygnuję z okazji biznesowej.",
    "Poczucie „szkoda przerywać” może być obecne. Decyzja nadal należy do mnie.",
    "Nuda nie jest błędem, który trzeba natychmiast naprawić.",
  ],
  family: [
    "Najważniejsze wspomnienia powstają często w zwykłych chwilach.",
    "★ Moja obecność daje Leonowi i Gai coś, czego nie zastąpi kolejny projekt.",
    "Kiedy jestem z Leonem, nie muszę rozwiązywać w głowie spraw firmy ani domu.",
    "Jeżeli odpłynę myślami, mogę po prostu wrócić do tej chwili.",
    "Przytulenie Leona jest ważniejsze niż dokończenie niepilnego zadania.",
    "~ Dzieciństwo moich dzieci dzieje się teraz, nie po ukończeniu wszystkich projektów.",
    "Monika, Leon i Gaja nie są przerwą od pracy. Są centralną częścią mojego życia.",
    "Nie muszę organizować wyjątkowych atrakcji, żeby wspólny czas był wartościowy.",
    "Leżenie obok dziecka, rozmowa i zabawa mogą być wystarczającym planem na wieczór.",
    "Chcę być tatą, który nie tylko zapewnia możliwości, ale naprawdę w nich uczestniczy.",
    "Buduję wspomnienia, nie tylko majątek.",
    "Gdy czuję impuls, by coś sprawdzić, mogę wybrać jeszcze jedną chwilę z bliskimi.",
    "~ Nie chcę zatrzymać czasu. Chcę coraz częściej być w nim obecny.",
  ],
  parenting: [
    "Nie muszę idealnie reagować na każdą emocję dziecka. Mogę być blisko i wrócić do spokoju.",
    "Leon może się złościć. Moim zadaniem nie jest uciszyć jego emocje, lecz pomóc mu przez nie przejść.",
    "W naszym domu chcę tłumaczyć decyzje zamiast podnosić głos.",
    "Dawanie dziecku wyboru buduje jego sprawczość, nawet w małych codziennych sprawach.",
    "Mogę przytulić Leona również wtedy, gdy przeżywa trudny moment.",
    "Dzieciństwo to nie projekt do zoptymalizowania, tylko relacja do przeżywania.",
    "Zwyczajna wspólna zabawa może stać się wspomnieniem, które zostanie na lata.",
    "Dbając o własny odpoczynek, łatwiej mi wnosić spokój w życie rodzinne.",
  ],
  estepona: [
    "★ Pamiętam leżak w Esteponie: słońce, morze i poczucie, że niczego więcej nie potrzebuję.",
    "Mogę siedzieć w słońcu i nie wymagać od siebie niczego więcej.",
    "W tamtej chwili byłem dokładnie tam, gdzie chciałem być.",
    "Mogę pójść z Leonem na plac zabaw albo na dobre jedzenie. To już jest pełny dzień.",
    "Estepona przypomina mi, po co buduję biznesy: dla wolności przeżywania życia.",
    "Morze jest wyjątkowe, ale część tego spokoju mogę wnosić także do codzienności.",
    "Nie wszystko musi być gotowe, by poczuć przedsmak życia, którego pragnę.",
    "Chcę stworzyć dom, w którym będziemy dobrze żyli, a nie tylko kolejną rzecz do dopracowania.",
    "Nie muszę każdego dobrego dnia zamieniać w okazję do dodatkowego osiągnięcia.",
    "Moim celem nie jest wieczny urlop. Moim celem jest wolność wyboru, jak przeżywam dzień.",
  ],
  energy: [
    "★ Moja energia jest moją walutą.",
    "Czas jest nieodnawialny. Pieniądze mogą dawać wybór, ale nie cofną czasu.",
    "Najważniejszy zwrot z energii to nie zawsze wynik biznesowy.",
    "Nie wszystko, co jest opłacalne finansowo, jest warte mojego czasu.",
    "Mogę wydać energię na wyniki albo na wspomnienia. Oba wybory są realne.",
    "Chronię energię nie po to, żeby stale więcej pracować, ale żeby lepiej żyć.",
    "Odpoczynek jest rozsądnym wykorzystaniem energii, nie jej marnowaniem.",
    "Nie muszę maksymalizować każdej godziny.",
    "Najlepszy system życia to taki, który pozwala również na spontaniczność.",
    "Czasem więcej zyskuję, odejmując coś z kalendarza niż dodając kolejne narzędzie.",
    "Mój plan dnia ma służyć mojemu życiu, nie odwrotnie.",
  ],
  freedom: [
    "Pieniądze są narzędziem do zaprojektowania dobrego życia, nie jedynym wynikiem gry.",
    "Chcę domu w Polsce, życia w Hiszpanii i przewidywalnych dochodów, bo cenię bezpieczeństwo rodziny.",
    "★ Mogę konsekwentnie budować bezpieczeństwo i jednocześnie korzystać z obecnego życia.",
    "Nie muszę spłacić wszystkiego, żeby mieć prawo do spokojnej niedzieli.",
    "Potrzebuję stabilności, a nie kontroli nad każdym przyszłym zdarzeniem.",
    "Niepewność nie oznacza, że powinienem nieustannie działać.",
    "Wolność to również możliwość powiedzenia „nie” atrakcyjnej okazji.",
    "Chcę mieć biznes, który daje mi wybór, a nie nieustanną gotowość.",
    "Nie muszę najpierw mieć wszystkiego, by docenić to, co już mam.",
    "Zarabianie ma służyć życiu, które chcę prowadzić — nie zastępować go.",
  ],
  business: [
    "★ Delivering Happiness by Simplicity — także we własnym życiu.",
    "Buduję systemy, które działają beze mnie, zamiast budować kolejne zależności ode mnie.",
    "Po latach jako CEO mogę tworzyć wartość inaczej: przez kierunek, ludzi i decyzje.",
    "Nie każda rzecz, którą potrafię zrobić, powinna być zrobiona przeze mnie.",
    "Najlepszym sposobem na odzyskanie czasu może być oddanie odpowiedzialności, nie szybsza praca.",
    "Dobry biznes powinien zwiększać moją wolność, nie tylko przychód.",
    "Prostota oznacza również umiejętność nieuruchamiania kolejnego procesu.",
    "Nie muszę być stale dostępny, żeby być odpowiedzialnym właścicielem.",
    "Praca koncepcyjna ma swoje miejsce. Poza tym miejscem mogę nie pracować.",
    "Mój Founder Time powinien dawać przestrzeń, nie automatycznie wypełniać się nowymi zadaniami.",
    "Wzrost firmy nie jest wart utraty tego, dla czego ją tworzę.",
  ],
  body: [
    "Pobudzenie jest odczuciem, nie automatycznie zagrożeniem.",
    "★ Nie muszę natychmiast pozbyć się każdego napięcia.",
    "Mogę zauważyć doznanie w ciele i wrócić do tego, co robiłem.",
    "Nie potrzebuję stuprocentowego spokoju, żeby przeżyć dobry dzień.",
    "Nie muszę codziennie testować, czy już jestem zregenerowany.",
    "Dobry sen i zwykły odpoczynek są cenne nawet bez idealnego HRV.",
    "Gdy jestem chory, potrzebuję mniejszego obciążenia, nie kolejnego ambitnego planu.",
    "Nie każde dziwne odczucie wymaga natychmiastowej interpretacji.",
    "Sprawdzam zdrowie rozsądnie i zgodnie z zaleceniami, nie w nieskończoność.",
    "Dzisiejsze napięcie nie przekreśla mojego postępu ani spokojnych dni.",
    "Nie mogę zmusić ciała do relaksu. Mogę stworzyć warunki, które mu sprzyjają.",
  ],
  identity: [
    "★ Jestem kimś więcej niż założycielem firm.",
    "Moja wartość nie zależy od liczby projektów, które uruchomię.",
    "Mogę być ambitny i spokojny jednocześnie.",
    "Nie muszę zasługiwać na odpoczynek.",
    "Docenianie tego, co mam, nie odbiera mi prawa do marzeń.",
    "Życie, które buduję, już teraz zawiera wiele rzeczy, na których mi zależy.",
    "Sukces smakuje lepiej, kiedy potrafię przy nim chwilę zostać.",
    "Nie muszę nieustannie podnosić poprzeczki, żeby moje życie miało sens.",
    "Szczęście to nie stała euforia: jest w nim miejsce na spokój, ciekawość, relacje i trudniejsze dni.",
    "Bycie obecnym jest osiągnięciem, którego nie widać w raportach.",
    "Nie buduję większego biznesu kosztem mniejszego życia.",
  ],
  rituals: [
    "Poranna kawa otwiera czas pracy. Wieczorny rytuał pozwala go zamknąć.",
    "Zapisuję otwarte sprawy. Nie muszę ich nosić w głowie.",
    "★ Zamykam laptop. Mówię na głos: „Na dzisiaj wystarczy”.",
    "Słyszę dźwięk CLOSE i pozwalam sprawom zostać na jutro.",
    "Mogę wypić kombuchę i po prostu być po pracy.",
    "Jeśli pomysł wraca, zapisuję jedno zdanie zamiast otwierać kolejną sesję.",
    "Dwie minuty spokojnego oddechu to propozycja, nie obowiązek.",
    "Joga nie jest nową rubryką do zaliczenia. Mogę ją wybrać, gdy mam ochotę.",
    "Nie muszę nawet otwierać Decompressly, jeśli właśnie dobrze odpoczywam.",
  ],
};

export const THOUGHTS: Thought[] = (Object.keys(RAW) as ThoughtCategory[]).flatMap((category) =>
  RAW[category].map((line, i) => {
    const star = line.startsWith("★ ");
    const gentle = line.startsWith("~ ");
    return {
      id: `${category}-${String(i + 1).padStart(2, "0")}`,
      category,
      text: line.replace(/^(★|~) /, ""),
      ...(star ? { star } : {}),
      ...(gentle ? { gentle } : {}),
    };
  }),
);

const Q: [ThoughtCategory, string][] = [
  ["demob", "Co we mnie jeszcze pozostaje w trybie mobilizacji, choć pilna sytuacja już minęła?"],
  ["demob", "Czy potrafię nacieszyć się ukończeniem jednego etapu, zanim zacznę następny?"],
  ["create", "Czy teraz bardziej potrzebuję ekscytacji, czy rzeczywistego odpoczynku?"],
  ["create", "Co bym zrobił z tym wolnym czasem, gdybym dziś nie mógł otworzyć Claude Code?"],
  ["fomo", "Czy robię to z wyboru, czy dlatego, że szkoda mi nie wykorzystać okazji?"],
  ["fomo", "Czy ten pomysł nadal byłby pilny, gdybym wrócił do niego za miesiąc?"],
  ["family", "Która zwyczajna chwila z Moniką, Leonem lub Gają była dziś naprawdę dobra?"],
  ["family", "Kiedy dzisiaj wróciłem uwagą do dziecka, mimo że wcześniej odpłynąłem myślami?"],
  ["parenting", "Jaką spokojną reakcję na emocje dziecka chciałbym częściej wybierać?"],
  ["parenting", "Kiedy ostatnio bawiliśmy się bez planu i bez pośpiechu?"],
  ["estepona", "Co konkretnie daje mi uczucie „nic nie muszę” i jak mogę dziś stworzyć tego małą wersję?"],
  ["energy", "Na co chcę wydać dzisiaj swoją energię, jeśli jest moją najcenniejszą walutą?"],
  ["freedom", "Jaki poziom bezpieczeństwa jest naprawdę potrzebny, a co jest już dodatkowym ulepszaniem?"],
  ["freedom", "Czy mogę czuć się dobrze dzisiaj, chociaż część długoterminowych celów wciąż jest otwarta?"],
  ["business", "Które zadanie najlepiej świadczy o tym, że system działa beze mnie?"],
  ["body", "Czy próbuję właśnie rozwiązać napięcie, czy mogę pozwolić mu chwilę być?"],
  ["identity", "Co dobrego wydarzyło się dzisiaj, czego nie da się zmierzyć przychodem?"],
  ["identity", "Czy potrafię powiedzieć „wystarczy”, nie rezygnując ze swoich marzeń?"],
];

export const REFLECTION_QUESTIONS: ReflectionQuestion[] = Q.map(([category, text], i) => ({ id: `q${String(i + 1).padStart(2, "0")}`, category, text }));

/** Where a single thought may appear. Each context shows at most one thought. */
export type ThoughtContext = "today" | "start" | "close" | "idea" | "idea-november" | "tension" | "rest" | "trip";

const CONTEXT_CATEGORIES: Record<ThoughtContext, ThoughtCategory[]> = {
  today: ["identity", "energy", "freedom", "estepona", "family", "business"],
  start: ["energy", "business", "create"],
  close: ["rituals", "demob", "family", "identity"],
  idea: ["fomo", "create"],
  "idea-november": ["demob", "fomo"],
  tension: ["body"],
  rest: ["estepona", "family", "parenting", "identity"],
  trip: ["estepona", "family"],
};

/** Contexts tied to a decision (work vs rest) — gentle reminders about time passing never appear here. */
const PRESSURE_CONTEXTS = new Set<ThoughtContext>(["start", "close", "idea", "idea-november", "tension", "today"]);

export interface ThoughtPrefs {
  hidden: string[];
  edits: Record<string, string>;
  custom: Thought[];
}

export function allThoughts(prefs: Pick<ThoughtPrefs, "custom">): Thought[] {
  return [...THOUGHTS, ...prefs.custom];
}

export function thoughtText(t: Thought, edits: Record<string, string>): string {
  return edits[t.id]?.trim() || t.text;
}

/** One stable thought per day and context, skipping hidden ones. */
export function pickThought(context: ThoughtContext, date: string, prefs: ThoughtPrefs): Thought | null {
  const cats = new Set(CONTEXT_CATEGORIES[context]);
  const hidden = new Set(prefs.hidden);
  const pool = allThoughts(prefs).filter((t) => cats.has(t.category) && !hidden.has(t.id) && !(t.gentle && PRESSURE_CONTEXTS.has(context)));
  if (!pool.length) return null;
  return pool[hashString(`${date}|${context}`) % pool.length];
}
