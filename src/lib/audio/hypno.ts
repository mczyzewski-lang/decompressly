/**
 * Shared building blocks of the guided sessions, written in the language of relaxation hypnosis:
 * pacing and leading, a descent (countdown or staircase), deepeners, ratification ("Bardzo dobrze, {imię}"),
 * an anchor as a post-hypnotic suggestion and a count back up. Not a clinical treatment.
 *
 * Length markers: "[od 15]" … "[/od]" only in sessions of 15+ minutes, "[do 10]" … "[/do]" only up to
 * 10 minutes. The same paragraphs in many sessions are recorded once and reused (cached by exact text).
 */

/** Settling in, eye closure, first breaths and — in longer sessions — a wave of relaxation through the body. */
export const INDUKCJA = `Ułóż się wygodnie. Usiądź albo połóż się tak, żeby ciało miało pełne podparcie. W każdej chwili możesz się poruszyć, otworzyć oczy i wrócić. Masz nad tym pełną kontrolę.

[pauza 5]

Znajdź wzrokiem jeden punkt przed sobą, odrobinę powyżej linii oczu. Patrz na niego spokojnie. Nie musisz mrugać celowo. Po prostu patrz.

[pauza 6]

I możesz zauważyć, jak powieki powoli robią się cięższe. Im dłużej patrzysz, tym cięższe się stają. Kiedy będą gotowe, pozwól im się zamknąć.

[pauza 8]

Bardzo dobrze, {imię}.

[pauza 3]

Weź teraz głęboki wdech. Zatrzymaj go na krótką chwilę. I wypuść powoli, razem z całym napięciem, które jest już gotowe odejść.

[pauza 7]

Jeszcze raz. Głęboki wdech. I długi, powolny wydech, jak westchnienie ulgi.

[pauza 8]

A teraz pozwól oddechowi płynąć samemu. Nie musisz nic z nim robić. Ciało wie, jak oddychać. Ty możesz tylko słuchać mojego głosu.

[pauza 8]

[od 15]
Za chwilę przejdziemy uwagą przez ciało, od góry do dołu. Nie musisz się starać. Rozluźnienie przychodzi samo, kiedy na nie pozwalasz.

Czoło robi się gładkie. Szerokie. Spokojne.

[pauza 5]

Mięśnie wokół oczu miękną. Powieki są ciężkie. Przyjemnie ciężkie.

[pauza 5]

Szczęka się rozluźnia. Zęby lekko się rozsuwają. Język spoczywa swobodnie.

[pauza 5]

To rozluźnienie spływa jak ciepła fala, w dół, na szyję i barki. Barki opadają. Jeszcze odrobinę niżej.

[pauza 6]

Ramiona robią się ciężkie. Łokcie. Przedramiona. Aż po dłonie i opuszki palców.

[pauza 6]

Klatka piersiowa unosi się i opada. Brzuch jest miękki. Nie musisz go trzymać.

[pauza 6]

Fala płynie dalej. W dół pleców, do bioder. Przez uda, kolana i łydki. Aż do stóp.

[pauza 6]

Całe ciało jest teraz ciężkie, ciepłe i spokojne. Bardzo dobrze, {imię}. Właśnie tak.

[pauza 8]
[/od]`;

/** The descent: a short countdown in brief sessions, a staircase from 15 minutes. */
export const ZEJSCIE = `[do 10]
Teraz policzę od pięciu do jednego. Z każdą liczbą możesz zejść odrobinę głębiej w spokój.

Pięć. Ciało robi się cięższe.

[pauza 3]

Cztery. Oddech zwalnia.

[pauza 3]

Trzy. Myśli robią się cichsze, jakby dochodziły z daleka.

[pauza 3]

Dwa. Coraz głębiej.

[pauza 3]

Jeden. Bardzo dobrze, {imię}. Jesteś tutaj. Spokojny i rozluźniony.

[pauza 6]
[/do]
[od 15]
Wyobraź sobie teraz schody. Dziesięć szerokich, miękkich stopni, które prowadzą w dół, do miejsca głębokiego spokoju. Za chwilę zaczniemy po nich schodzić. Z każdym stopniem, z każdą liczbą, możesz zapadać się dwa razy głębiej w przyjemne rozluźnienie.

[pauza 4]

Dziesięć. Stawiasz stopę na pierwszym stopniu.

[pauza 3]

Dziewięć. Głębiej. Spokojniej.

[pauza 3]

Osiem. Każdy wydech zabiera Cię niżej.

[pauza 3]

Siedem. Ciało robi się coraz cięższe.

[pauza 3]

Sześć. Myśli zwalniają, jak liście, które powoli opadają na wodę.

[pauza 3]

Pięć. W połowie drogi. Dwa razy głębiej.

[pauza 3]

Cztery. Nic nie musisz. Tylko schodzisz.

[pauza 3]

Trzy. Coraz głębiej i coraz spokojniej.

[pauza 3]

Dwa. Prawie na dole.

[pauza 3]

Jeden. I jesteś na dole. W miejscu głębokiego spokoju.

[pauza 8]

Bardzo dobrze, {imię}. Właśnie tak.

[pauza 5]
[/od]`;

/** Deepeners for longer sessions: utilization of sounds, permission not to listen, fractionation from 30 minutes. */
export const POGLEBIENIE = `[od 20]
Możesz teraz zauważyć, że każdy dźwięk wokół Ciebie staje się częścią tego doświadczenia. Każdy szmer, każdy odgłos z daleka może prowadzić Cię jeszcze głębiej.

[pauza 8]

Nie musisz nawet słuchać mnie uważnie. Twoja głębsza część i tak usłyszy wszystko, co jest dla Ciebie ważne. A Ty możesz po prostu odpoczywać.

[pauza 10]

Z każdym oddechem głębiej. Z każdym wydechem spokojniej.

[pauza 12]
[/od]
[od 30]
Za chwilę policzę do trzech. Przy trzech otworzysz na moment oczy, a kiedy je zamkniesz, zapadniesz się w ten spokój jeszcze głębiej niż teraz.

Raz. Dwa. Trzy. Otwórz oczy na chwilę.

[pauza 3]

I zamknij je. Głębiej. Dużo głębiej.

[pauza 8]

Jeszcze raz. Raz. Dwa. Trzy. Otwórz oczy.

[pauza 3]

I zamknij. Pozwól sobie opaść dwa razy głębiej. Bardzo dobrze, {imię}.

[pauza 12]

Pod tym spokojem jest jeszcze cichsze miejsce. Nie musisz go szukać. Ono samo przychodzi, kiedy przestajesz się starać.

[pauza 20]
[/od]`;

/** An anchor: thumb and index finger bring the calm back later (post-hypnotic suggestion). */
export const KOTWICA = `[od 15]
Teraz połączysz ten spokój z prostym gestem. Złącz delikatnie kciuk i palec wskazujący jednej dłoni.

[pauza 4]

Poczuj ten dotyk. I pozwól, żeby całe to rozluźnienie, cały ten spokój, połączyły się z tym gestem.

[pauza 8]

Od teraz, kiedy tylko złączysz kciuk i palec wskazujący i weźmiesz jeden spokojny oddech, Twoje ciało przypomni sobie to uczucie. Za każdym razem łatwiej. Za każdym razem szybciej.

[pauza 6]

Możesz już rozłączyć palce. Bardzo dobrze.

[pauza 4]
[/od]`;

/** Count back up from one to five: awake, rested, present. */
export const POWROT = `Za chwilę policzę od jednego do pięciu. Z każdą liczbą będziesz wracać, coraz bardziej obecny. A przy pięciu otworzysz oczy, wypoczęty i spokojny, zabierając ze sobą wszystko, co dobre.

[pauza 3]

Jeden. Zaczynasz wracać. Powoli. W swoim tempie.

[pauza 3]

Dwa. Czujesz ciężar ciała i miejsce, na którym leżysz albo siedzisz.

[pauza 3]

Trzy. Poruszasz delikatnie palcami dłoni i stóp. Oddech robi się pełniejszy.

[pauza 3]

Cztery. Słyszysz dźwięki wokół siebie. Jesteś prawie z powrotem.

[pauza 3]

Pięć. Otwórz oczy. Rozejrzyj się spokojnie. Bardzo dobrze, {imię}.

[pauza 3]`;

/** Evening ending: no waking up — the calm may turn into sleep. */
export const POWROT_SEN = `Jeśli to Twój czas snu, nie musisz wracać. Pozwól, żeby ten spokój powoli przeszedł w sen. Mój głos za chwilę ucichnie, a Ty możesz zostać tam, gdzie jesteś.

[pauza 10]

A jeśli chcesz jeszcze wrócić do wieczoru, weź głębszy oddech, porusz palcami i otwórz oczy wtedy, kiedy będziesz gotowy. Bez pośpiechu.

[pauza 8]`;
