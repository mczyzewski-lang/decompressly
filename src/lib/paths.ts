import type { AudioSessionDef } from "./audio/scripts";
import type { PathRun } from "./types";

/**
 * "Ścieżki" — a sequence of audio sessions that carry a thread: after each session you write one
 * sentence, and the next session quotes it back and works with it (audio → reflection → audio …).
 * Written in the language of relaxation and self-compassion practice; not therapy, nothing is diagnosed.
 *
 * Script markers: everything from the audio scripts, plus a paragraph "{echo}" — the place where the
 * previous reflection is woven in. "{myśl}" is the most recent shared reflection, "{pierwsza}" the first one.
 */
export interface PathStep {
  n: number;
  title: string;
  theme: string;
  minutes: number;
  script: string;
  /** woven in where "{echo}" stands, when there is an earlier reflection to quote */
  echo: string;
  /** used instead of `echo` when it needs "{pierwsza}" but only one reflection exists */
  echoSingle?: string;
  /** used when there is nothing to quote (first step, skipped or private reflection) */
  noEcho: string;
  question: string;
  placeholder: string;
  background: AudioSessionDef["suggestedBackground"];
}

export interface PathDef {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  steps: PathStep[];
}

const oczyszczenie: PathStep[] = [
  {
    n: 1,
    title: "Zauważyć, co noszę",
    theme: "Bez naprawiania. Tylko zobaczyć, co leży na wierzchu.",
    minutes: 7,
    background: "nature",
    question: "Co noszę w sobie najciężej? Jedno zdanie wystarczy.",
    placeholder: "np. Ciągle wracam myślami do rzeczy, których nie zdążyłem zrobić.",
    noEcho: "",
    echo: "",
    script: `{imię}, to pierwszy etap Ścieżki oczyszczenia. Nie musisz nic naprawiać. Dziś tylko zauważasz.

Usiądź albo połóż się wygodnie. Pozwól, żeby podłoże przejęło ciężar ciała.

[pauza 6]

Zrób trzy spokojne oddechy. Wdech nosem. I dłuższy, cichy wydech.

[pauza 14]

Wyobraź sobie, że masz przy sobie plecak. Nosisz go od dawna, więc przestałeś zauważać, ile waży. Dziś po prostu zdejmujesz go na chwilę i stawiasz obok siebie.

[pauza 10]

Zajrzyj do środka, bez pośpiechu. Może jest tam sprawa z pracy. Może rozmowa, która nie wybrzmiała. Może zmęczenie, które nie ma jeszcze nazwy.

[pauza 16]

Nie wyjmuj wszystkiego naraz. Zobacz tylko, co leży na samym wierzchu. Co jest teraz najcięższe.

[pauza 20]

Jeśli coś się pojawiło, nie oceniaj tego. Nie tłumacz się z tego. Powiedz w myślach po prostu: widzę cię.

[pauza 14]

{echo}

Zauważ, jak oddychasz, kiedy na to patrzysz. Może oddech jest płytszy. Może ramiona odrobinę się uniosły. To w porządku. Ciało mówi tylko, że to ważne.

[pauza 12]

Połóż dłoń tam, gdzie jest Ci najprzyjemniej. Na sercu, na brzuchu albo na udzie. Poczuj ciepło własnej dłoni.

[pauza 16]

Nie musisz dziś niczego rozwiązywać, {imię}. Samo zauważenie jest pierwszym krokiem. Plecak może jeszcze chwilę postać obok.

[pauza 14]

Za moment zapiszesz jedno zdanie. O tym, co zobaczyłeś na wierzchu. Nie musi być mądre ani pełne. Wystarczy, że będzie prawdziwe.

[pauza 6]

Weź głębszy oddech. Porusz palcami dłoni i stóp. Kiedy będziesz gotowy, otwórz oczy.`,
  },
  {
    n: 2,
    title: "Przyjrzeć się z życzliwością",
    theme: "Zrozumieć, przed czym ta ciężkość próbuje chronić.",
    minutes: 8,
    background: "nature",
    question: "Przed czym ta ciężkość próbuje mnie chronić? Czego mnie uczy?",
    placeholder: "np. Chyba chroni mnie przed poczuciem, że kogoś zawiodę.",
    echo: `Po ostatniej sesji zostały takie słowa: „{myśl}”.

[pauza 10]

Nie musisz ich teraz poprawiać ani rozumieć do końca. Pozwól im po prostu wybrzmieć.`,
    noEcho: `Przypomnij sobie to, co ostatnio było najcięższe. Nie musisz tego nazywać słowami. Wystarczy, że wiesz, o co chodzi.

[pauza 10]`,
    script: `Witaj z powrotem, {imię}. To drugi etap. Dziś przyglądasz się temu, co zauważyłeś ostatnio. Z życzliwością, nie z oceną.

Usiądź wygodnie. Pozwól, żeby oczy się zamknęły albo spoczęły nisko, na jednym punkcie.

[pauza 6]

Kilka spokojnych oddechów. Każdy wydech odrobinę dłuższy od wdechu.

[pauza 14]

{echo}

[pauza 6]

Wyobraź sobie, że ta myśl siedzi obok Ciebie na ławce. Nie musisz jej przytulać ani wyganiać. Siedzicie razem i patrzycie w tę samą stronę.

[pauza 16]

Zapytaj ją spokojnie: od kiedy ze mną jesteś?

[pauza 16]

I jeszcze: przed czym próbujesz mnie chronić?

[pauza 20]

Często to, co ciąży, próbuje o coś zadbać. O bezpieczeństwo. O bliskich. O to, żeby nic nie umknęło. Nie musisz się z nią zgadzać, żeby ją zrozumieć.

[pauza 16]

Powiedz jej w myślach: dziękuję, że się o mnie troszczysz. Teraz ja się tym zajmę. W swoim tempie.

[pauza 14]

Zauważ, czy coś w ciele się zmieniło. Choćby odrobinę. Szczęka. Ramiona. Brzuch.

[pauza 14]

Za chwilę zapiszesz jedno zdanie. O tym, przed czym ta ciężkość Cię chroni albo czego próbuje Cię nauczyć.

[pauza 5]

Głębszy oddech. Delikatny ruch głową w prawo i w lewo. Otwórz oczy, kiedy zechcesz.`,
  },
  {
    n: 3,
    title: "Gdzie to mieszka w ciele",
    theme: "Odnaleźć to w ciele i dać temu miejscu oddech.",
    minutes: 8,
    background: "orchestral",
    question: "Czego potrzebuję, kiedy to czuję?",
    placeholder: "np. Potrzebuję chwili ciszy i tego, żeby ktoś mnie wysłuchał.",
    echo: `Ostatnio zapisałeś: „{myśl}”.

[pauza 10]

Przyjmij te słowa jak krótki list od siebie samego. Dziś sprawdzisz, gdzie mieszkają w ciele.`,
    noEcho: `Pomyśl przez chwilę o tym, czemu przyglądałeś się ostatnio. Bez szczegółów. Tylko ogólny kształt.

[pauza 10]`,
    script: `{imię}, to trzeci etap. Dziś słuchasz ciała, bo ono często wie wcześniej niż głowa.

Ułóż się wygodnie. Stopy oparte, dłonie luźno.

[pauza 6]

Oddychaj spokojnie. Wdech, i długi wydech, jak westchnienie ulgi.

[pauza 14]

{echo}

[pauza 6]

Teraz powoli przejdź uwagą przez ciało. Czoło i oczy.

[pauza 8]

Szczęka i gardło.

[pauza 8]

Ramiona i klatka piersiowa.

[pauza 8]

Brzuch.

[pauza 8]

Zatrzymaj się tam, gdzie czujesz najwięcej. Ucisk, ciepło, napięcie, a może pustkę. Cokolwiek tam jest, jest w porządku.

[pauza 18]

Wyobraź sobie, że kierujesz oddech prosto w to miejsce. Wdech przynosi trochę przestrzeni. Wydech niczego nie wymusza. Tylko zmiękcza brzegi.

[pauza 20]

Jeśli chcesz, połóż tam dłoń. Jakbyś mówił temu miejscu: jestem tu.

[pauza 18]

Zapytaj to miejsce bez słów: czego potrzebujesz?

[pauza 22]

Może odpowiedź przyjdzie od razu. Może nie przyjdzie wcale. Jedno i drugie jest w porządku, {imię}.

[pauza 12]

Za chwilę zapiszesz jedno zdanie o tym, czego potrzebujesz, kiedy to czujesz.

[pauza 5]

Weź głębszy oddech. Przeciągnij się delikatnie. Otwórz oczy, kiedy zechcesz.`,
  },
  {
    n: 4,
    title: "Łagodność wobec siebie",
    theme: "Potraktować siebie tak, jak potraktowałbyś przyjaciela.",
    minutes: 8,
    background: "nature",
    question: "Co mogę odłożyć? Co już nie jest moje do niesienia?",
    placeholder: "np. Mogę odłożyć przekonanie, że wszystko musi zależeć ode mnie.",
    echo: `Twoja ostatnia odpowiedź brzmiała: „{myśl}”.

[pauza 10]

To ważna informacja, {imię}. Potrzeba nie jest słabością. Jest wskazówką.`,
    noEcho: `Pomyśl przez chwilę o tym, czego ostatnio potrzebowałeś, a czego może sobie nie dawałeś.

[pauza 10]`,
    script: `Witaj, {imię}. To czwarty etap, środek drogi. Dziś ćwiczysz łagodność wobec siebie.

Usiądź wygodnie i pozwól, żeby barki opadły odrobinę niżej.

[pauza 6]

Trzy spokojne oddechy. Bez liczenia, bez wysiłku.

[pauza 14]

{echo}

[pauza 6]

Wyobraź sobie teraz bliskiego przyjaciela. Kogoś, kogo naprawdę lubisz. Przychodzi do Ciebie i mówi dokładnie to, co Ty dziś czujesz.

[pauza 14]

Co byś mu powiedział? Jakim tonem? Może położyłbyś mu rękę na ramieniu.

[pauza 20]

A teraz spróbuj powiedzieć to samo sobie. Tym samym tonem. Nawet jeśli brzmi to na początku trochę obco.

[pauza 20]

Możesz powtórzyć w myślach: to jest trudne. Nie jestem w tym sam. Mogę być dla siebie łagodny.

[pauza 16]

Robię, co mogę. I to wystarczy na dziś.

[pauza 16]

Połóż dłoń na sercu albo na brzuchu. Poczuj ciepło i lekki nacisk. Ciało rozumie ten gest bez słów.

[pauza 18]

Zauważ, że nie wszystko, co niesiesz, należy do Ciebie. Część to cudze oczekiwania. Część to stare zasady, które kiedyś miały sens.

[pauza 16]

Za chwilę zapiszesz jedno zdanie. Co możesz odłożyć. Co już nie jest Twoje do niesienia.

[pauza 5]

Głęboki oddech. Porusz dłońmi. Otwórz oczy, kiedy będziesz gotowy.`,
  },
  {
    n: 5,
    title: "Odłożyć na brzegu",
    theme: "Odłożyć to, co już nie jest moje. Nie wyrzucić na siłę — odłożyć.",
    minutes: 9,
    background: "nature",
    question: "Co jest teraz lżejsze? Co zostaje, kiedy to odkładam?",
    placeholder: "np. Lżej mi w ramionach. Zostaje ciekawość, co będzie dalej.",
    echo: `Ostatnio zapisałeś: „{myśl}”.

[pauza 10]

Dziś możesz to odłożyć, {imię}. Nie wyrzucić na siłę. Po prostu odłożyć.`,
    noEcho: `Pomyśl o jednej rzeczy, którą nosisz, a która nie musi już być Twoja. Nie musisz jej nazywać. Wystarczy, że ją czujesz.

[pauza 10]`,
    script: `{imię}, to piąty etap. Dziś odkładasz.

Ułóż się wygodnie. Pozwól, żeby oddech zwolnił sam.

[pauza 8]

{echo}

[pauza 6]

Wyobraź sobie wieczorną plażę. Piasek jest jeszcze ciepły od słońca. Morze jest spokojne, fale przychodzą i odchodzą w swoim rytmie.

[pauza 14]

Idziesz powoli brzegiem. Pod stopami czujesz chłodny, wilgotny piasek.

[pauza 12]

Na brzegu leży gładki kamień. Podnosisz go. Jest cięższy, niż wyglądał.

[pauza 10]

Wyobraź sobie, że wkładasz do tego kamienia to, co chcesz odłożyć. Słowo po słowie. Bez pośpiechu.

[pauza 22]

Kiedy będziesz gotowy, pochyl się i połóż kamień na piasku, tuż przy wodzie. Nie rzucaj go. Połóż.

[pauza 14]

Wyprostuj się. Zauważ dłonie, które są teraz puste. I ramiona.

[pauza 14]

Przychodzi fala. Delikatnie obmywa kamień. Odchodzi. Przychodzi następna.

[pauza 18]

Nie musisz patrzeć, co się z nim stanie. Morze ma swój czas. Ty możesz już iść dalej.

[pauza 16]

Odwróć się i zrób kilka kroków. Lżej. Wolniej. Wydech może być teraz dłuższy niż kiedykolwiek dziś.

[pauza 20]

Gdyby to, co odłożyłeś, chciało wrócić, to w porządku. Możesz je odkładać tyle razy, ile trzeba. Każde odłożenie się liczy.

[pauza 14]

Za chwilę zapiszesz jedno zdanie. Co jest teraz lżejsze. Co zostaje.

[pauza 5]

Weź głęboki oddech. Poczuj podłoże pod sobą. Otwórz oczy, kiedy zechcesz.`,
  },
  {
    n: 6,
    title: "Nowa przestrzeń",
    theme: "Zauważyć, co może wejść w zwolnione miejsce.",
    minutes: 8,
    background: "orchestral",
    question: "Jakie jedno zdanie chcę zabrać ze sobą dalej?",
    placeholder: "np. Mogę budować spokojnie i nadal być blisko swoich.",
    echo: `Po ostatniej sesji pojawiło się: „{myśl}”.

[pauza 10]

Zauważ, że w miejscu, z którego coś odłożyłeś, zrobiło się trochę przestrzeni.`,
    noEcho: `Przypomnij sobie moment, w którym ostatnio coś odłożyłeś. Nawet jeśli tylko na chwilę.

[pauza 10]`,
    script: `Witaj, {imię}. To szósty etap. Dziś nie odkładasz już niczego. Dziś zauważasz, co jest.

Usiądź albo połóż się. Pozwól ciału być ciężkim i spokojnym.

[pauza 6]

Kilka oddechów. Wdech przez nos, powolny wydech ustami.

[pauza 14]

{echo}

[pauza 6]

Ta przestrzeń nie musi być od razu niczym wypełniona. Możesz po prostu w niej pobyć. Jak w pokoju, z którego wyniesiono stare meble, a okno jest otwarte.

[pauza 18]

Poczuj powietrze, które wpada przez to okno. Świeże. Trochę chłodne.

[pauza 14]

Zapytaj siebie: co chcę tu wpuścić?

[pauza 18]

Może spokój. Może więcej czasu z Moniką. Może zabawę z Leonem i Gają, bez telefonu w ręce. Może pracę, która nie musi być pośpiechem.

[pauza 20]

Wybierz jedno. Tylko jedno. Wyobraź sobie, jak powoli wchodzi do tego pokoju i siada tam, gdzie mu dobrze.

[pauza 20]

Zauważ, co czujesz w ciele, kiedy na to patrzysz. Może ciepło. Może lekkość w klatce piersiowej.

[pauza 16]

To miejsce jest Twoje, {imię}. Możesz do niego wracać.

[pauza 12]

Za chwilę zapiszesz jedno zdanie, które chcesz zabrać ze sobą dalej.

[pauza 5]

Głębszy oddech. Delikatny ruch ramion. Otwórz oczy, kiedy zechcesz.`,
  },
  {
    n: 7,
    title: "Domknięcie",
    theme: "Zobaczyć całą drogę i podziękować sobie.",
    minutes: 8,
    background: "orchestral",
    question: "Co chcę sobie powiedzieć na koniec tej drogi?",
    placeholder: "np. Dobrze, że się zatrzymałem. Mogę to robić częściej.",
    echo: `Na początku tej drogi zapisałeś: „{pierwsza}”.

[pauza 12]

A ostatnio zostało zdanie: „{myśl}”.

[pauza 14]

Zobacz, jaką drogę przeszedłeś między tymi słowami. Nie musisz jej oceniać. Wystarczy, że ją widzisz.`,
    echoSingle: `Ostatnio zostało zdanie: „{myśl}”.

[pauza 12]

Pozwól mu wybrzmieć jeszcze raz. To Twoje zdanie na dalszą drogę.`,
    noEcho: `Przypomnij sobie, od czego ta droga się zaczęła. I gdzie jesteś dzisiaj. Bez oceniania.

[pauza 12]`,
    script: `{imię}, to ostatni etap Ścieżki oczyszczenia. Dziś domykasz.

Ułóż się wygodnie. Pozwól, żeby oddech płynął sam.

[pauza 8]

{echo}

[pauza 8]

Przez kilka ostatnich sesji robiłeś coś, czego nie robi się często. Zatrzymywałeś się. Patrzyłeś na to, co trudne. Odkładałeś to, co nie było Twoje.

[pauza 16]

Podziękuj sobie za to. W myślach, prostymi słowami. Dziękuję, że się zatrzymałem.

[pauza 16]

Wyobraź sobie, że stoisz na końcu ścieżki i odwracasz się. Widzisz ławkę, na której siedziałeś ze swoją myślą. Brzeg, na którym zostawiłeś kamień. Pokój z otwartym oknem.

[pauza 20]

Wszystkie te miejsca zostają w Tobie. Możesz do nich wrócić, kiedy zechcesz.

[pauza 14]

Połóż dłoń na sercu. Poczuj, jak spokojnie bije.

[pauza 16]

Niczego nie trzeba dziś kończyć na zawsze. Oczyszczanie to nie jednorazowy wysiłek. To łagodny nawyk, do którego możesz wracać.

[pauza 16]

Za chwilę zapiszesz ostatnie zdanie tej drogi. Coś, co chcesz sobie powiedzieć.

[pauza 6]

Weź głęboki oddech. Poczuj całe ciało. Otwórz oczy, kiedy będziesz gotowy.`,
  },
];

export const PATHS: PathDef[] = [
  {
    id: "oczyszczenie",
    title: "Ścieżka oczyszczenia",
    subtitle: "7 sesji · audio → refleksja → audio",
    description:
      "Każda sesja kończy się jednym zdaniem od Ciebie. Kolejna sesja przytacza je głosem i pracuje z nim dalej: zauważyć, zrozumieć, poczuć, odłożyć, zrobić miejsce, domknąć.",
    steps: oczyszczenie,
  },
];

export const PATH_BY_ID: Record<string, PathDef> = Object.fromEntries(PATHS.map((p) => [p.id, p]));

/** Audio session ids of path steps: "p.<pathId>.<n>". */
export const pathSessionId = (pathId: string, n: number) => `p.${pathId}.${n}`;

export function parsePathSessionId(id: string): { path: PathDef; step: PathStep } | null {
  const m = /^p\.([a-z0-9-]+)\.(\d+)$/.exec(id);
  if (!m) return null;
  const path = PATH_BY_ID[m[1]];
  const step = path?.steps.find((s) => s.n === Number(m[2]));
  return path && step ? { path, step } : null;
}

/** A reflection is spoken back verbatim, so it must not carry script markers or paragraph breaks. */
export function sanitizeReflection(text: string): string {
  return text
    .replace(/[[\]{}]/g, "")
    .replace(/[„”"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

const shareable = (run: PathRun | undefined, n: number) => {
  const r = run?.notes[n];
  return r && !r.private && r.text.trim() ? sanitizeReflection(r.text) : null;
};

/** The thread a step picks up: the latest earlier shared reflection, and the very first one. */
export function threadFor(run: PathRun | undefined, n: number): { last: string | null; lastStep: number | null; first: string | null; firstStep: number | null } {
  let last: string | null = null;
  let lastStep: number | null = null;
  for (let i = n - 1; i >= 1 && !last; i--) {
    last = shareable(run, i);
    if (last) lastStep = i;
  }
  let first: string | null = null;
  let firstStep: number | null = null;
  for (let i = 1; i < n && !first; i++) {
    first = shareable(run, i);
    if (first) firstStep = i;
  }
  return { last, lastStep, first, firstStep };
}

/** Fills the "{echo}" paragraph of a step script with the thread of earlier reflections. */
export function weaveEcho(script: string, step: PathStep, run: PathRun | undefined): string {
  const t = threadFor(run, step.n);
  let echo = step.noEcho;
  if (t.last) {
    const needsFirst = step.echo.includes("{pierwsza}");
    const twoDistinct = t.first && t.firstStep !== t.lastStep;
    echo = needsFirst && !twoDistinct ? (step.echoSingle ?? step.noEcho) : step.echo;
    echo = echo.replaceAll("{myśl}", t.last).replaceAll("{pierwsza}", t.first ?? "");
  }
  // an empty echo removes the paragraph, so no stray blank lines reach the timeline
  return script.replace(/\n*\{echo\}\n*/g, echo.trim() ? `\n\n${echo.trim()}\n\n` : "\n\n").trim();
}

/** Step n is open once the previous step has a reflection (written or consciously skipped). */
export function stepOpen(run: PathRun | undefined, n: number): boolean {
  return n === 1 || !!run?.notes[n - 1];
}

/** The first step that has no reflection yet (or null when the path is complete). */
export function currentStep(path: PathDef, run: PathRun | undefined): number | null {
  const s = path.steps.find((x) => !run?.notes[x.n]);
  return s ? s.n : null;
}

/** An audio-session definition for a path step, so the regular recording pipeline can play it. */
export function pathAudioDef(path: PathDef, step: PathStep): AudioSessionDef {
  return {
    id: pathSessionId(path.id, step.n),
    title: `${step.n}. ${step.title}`,
    minutes: step.minutes,
    description: step.theme,
    suggestedMotif: "close",
    suggestedBackground: step.background,
    script: step.script,
  };
}
