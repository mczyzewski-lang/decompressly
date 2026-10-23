import { fillName, type NameForms } from "../names";
import { INDUKCJA, KOTWICA, POGLEBIENIE, POWROT, POWROT_SEN, ZEJSCIE } from "./hypno";

/**
 * Original guided sessions in the language of relaxation hypnosis. "{imię}" becomes the vocative form
 * of the name ("Marku"), "{imię_m}" the nominative ("Marek") — both configurable in Settings.
 * Every session can be 10, 15, 20 or 30 minutes: "[od N]" blocks deepen longer sessions and the
 * silences stretch to the chosen length. Not a clinical treatment.
 */
export interface AudioSessionDef {
  id: string;
  title: string;
  /** default length in minutes (10, 15, 20 or 30) */
  minutes: number;
  description: string;
  suggestedMotif: "start" | "close" | "none";
  suggestedBackground: "nature" | "jazz" | "system" | "orchestral" | "none";
  script: string;
}

const demob = `Cześć, {imię}. To jest Twój czas na głęboką demobilizację. Przez najbliższe minuty nie masz nic do zrobienia. Nie ma tu zadania i nie ma złego wykonania.

[pauza 4]

${INDUKCJA}

${ZEJSCIE}

${POGLEBIENIE}

{imię}, przez ostatnie miesiące wiele od siebie wymagałeś. Podejmowałeś decyzje. Budowałeś. Rozwiązywałeś trudne problemy.

[pauza 5]

Brałeś na siebie odpowiedzialność, kiedy nie było jeszcze wiadomo, jak to wszystko się skończy. Twoje ciało i Twoja uwaga długo pracowały w trybie mobilizacji. Czujne. Gotowe.

[pauza 8]

I teraz, właśnie teraz, możesz to wszystko powoli odłożyć. Tak, jak odkłada się ciężki plecak po długiej drodze.

[pauza 10]

Twoja kreatywność nigdzie nie znika. Twoje możliwości nie znikają. Są bezpieczne. Możesz pozwolić sobie odpocząć.

[pauza 14]

Bardzo dobrze, {imię}.

[pauza 6]

[od 20]
Wyobraź sobie, że w Twoim ciele jest przełącznik. Przez wiele miesięcy był ustawiony na „działaj”. Nie musisz go szarpać. Wystarczy, że położysz na nim dłoń.

[pauza 8]

I powoli, bardzo powoli, przesuwasz go w stronę „odpoczywaj”. Z każdym wydechem odrobinę dalej.

[pauza 12]

Zauważ, co zmienia się w ciele, kiedy przełącznik się przesuwa. Może cieplej robi się w brzuchu. Może ramiona stają się cięższe. Może oddech sam się wydłuża.

[pauza 16]

Właśnie tak. Ciało pamięta, jak odpoczywać. Czasem potrzebuje tylko pozwolenia. A Ty właśnie mu go dajesz.

[pauza 14]
[/od]

Wyobraź sobie teraz leżak w Esteponie. Czujesz przyjemne ciepło słońca na twarzy. Słyszysz morze.

[pauza 10]

Fale przychodzą i odchodzą. Z każdą falą, która cofa się po piasku, możesz zapaść się odrobinę głębiej w leżak.

[pauza 14]

Nie masz potrzeby sprawdzania wiadomości. Nie musisz podejmować żadnej decyzji. Za chwilę możesz pójść na spacer z Leonem. Możesz zjeść coś dobrego. Albo po prostu zostać tutaj.

[pauza 18]

[od 15]
Poczuj, jak słońce rozgrzewa Twoją twarz. Jak ciepło schodzi na ramiona, na klatkę piersiową, na brzuch. Nikt niczego od Ciebie nie oczekuje.

[pauza 20]
[/od]

Jeśli pojawi się myśl o pracy, o pomyśle, o czymś, co można by zbudować, możesz ją zauważyć. Powiedz jej w myślach: dziękuję, zapiszę cię później. I wróć do słońca. Do dźwięku morza.

[pauza 16]

Twoje pomysły są jak łodzie zacumowane w porcie. Są bezpieczne. Nikt ich nie zabierze. Możesz na nie patrzeć z brzegu i nie musisz żadną z nich wypływać.

[pauza 18]

[od 20]
Przez dziewięć miesięcy byłeś na wojnie. Teraz ta wojna dobiega końca. Nie musisz od razu budować kolejnego miasta. Możesz wrócić do domu. Możesz cieszyć się pokojem.

[pauza 18]
[/od]

To uczucie nie musi pojawiać się tylko w Hiszpanii. Twoja głębsza część już wie, jak je odnaleźć. Przy porannej kawie. W drodze do domu. Wieczorem, kiedy Gaja opowiada Ci o swoim dniu.

[pauza 14]

I im częściej do niego wracasz, tym łatwiej przychodzi. Samo. Bez wysiłku.

[pauza 12]

${KOTWICA}

[od 30]
Zostań teraz w tej ciszy. Ja przez chwilę nic nie będę mówić. Możesz po prostu być. Ciało w tym czasie samo wykona swoją pracę.

[pauza 120]

Bardzo dobrze, {imię}. Głęboko i spokojnie.

[pauza 60]
[/od]

Enjoy what you've built.

[pauza 20]

Możesz po prostu być, {imię}.

[pauza 40]

${POWROT}

Na dzisiaj wystarczy, {imię}.`;

const restart = `Cześć, {imię}. To jest Deep Restart. Czas, w którym Twój układ nerwowy może się zatrzymać, wyciszyć i zregenerować. Nic tu nie musisz osiągać. Wystarczy, że pozwolisz się prowadzić.

[pauza 5]

Zanim zamkniesz oczy, rozejrzyj się powoli po miejscu, w którym jesteś. Bez pośpiechu. Pozwól oczom zatrzymać się na kilku przedmiotach. Na świetle. Na kolorach.

[pauza 10]

To prosty sygnał dla ciała: jest bezpiecznie. Nic się nie dzieje. Możesz zwolnić.

[pauza 6]

Teraz zrób podwójny wdech nosem. Jeden wdech, i na jego szczycie jeszcze jeden, krótki. A potem długi, powolny wydech ustami.

[pauza 9]

Jeszcze raz. Podwójny wdech nosem. I długi wydech, aż do końca.

[pauza 9]

I trzeci raz. Wdech, dopełnienie. I bardzo długi wydech.

[pauza 10]

Bardzo dobrze, {imię}. Teraz pozwól oddechowi płynąć swobodnie.

[pauza 6]

${INDUKCJA}

[od 15]
Teraz, jeśli masz ochotę, zamknij usta i zanuć cicho, na wydechu. Mmmm. Poczuj delikatne drgania w gardle i w klatce piersiowej.

[pauza 10]

Jeszcze raz, na długim wydechu. Mmmm.

[pauza 10]

I trzeci raz. Mmmm. Te drgania są jak delikatny masaż od środka. Twoje ciało dobrze je rozumie.

[pauza 12]
[/od]

${ZEJSCIE}

${POGLEBIENIE}

Poczuj teraz podłoże pod sobą. Wszystkie miejsca, w których ciało jest podparte. Plecy. Głowa. Ręce. Nogi.

[pauza 10]

Podłoże Cię trzyma. Nie musisz się trzymać sam. Możesz oddać mu cały ciężar.

[pauza 12]

Powtarzaj w myślach za mną, powoli. Moje ręce są ciężkie.

[pauza 10]

Moje ręce są ciężkie i ciepłe.

[pauza 12]

Moje nogi są ciężkie i ciepłe.

[pauza 12]

Moje serce bije spokojnie i równo.

[pauza 12]

Oddech płynie sam. Spokojnie.

[pauza 12]

Brzuch jest ciepły i miękki.

[pauza 12]

Czoło jest przyjemnie chłodne.

[pauza 14]

Bardzo dobrze, {imię}. Właśnie tak.

[pauza 8]

[od 20]
Teraz poszukaj w ciele miejsca, które jest dziś najbardziej spokojne. Może to dłonie. Może stopy. Może miejsce, w którym plecy dotykają podłoża. Zatrzymaj tam uwagę.

[pauza 14]

Poczuj, jak tam jest. Ciepło. Ciężar. Spokój.

[pauza 12]

A teraz, tylko na moment, zauważ miejsce, w którym jest trochę napięcia. Nie zmieniaj go. Po prostu je zauważ.

[pauza 10]

I wróć do miejsca spokoju. Pozwól mu się rozszerzyć. Jak plama ciepła, która powoli rozlewa się dalej.

[pauza 16]

Twój układ nerwowy uczy się teraz czegoś ważnego. Że może dotknąć napięcia i wrócić do spokoju. Że zawsze jest droga powrotna.

[pauza 16]
[/od]

Wyobraź sobie, że Twoje ciało przełącza się teraz w tryb regeneracji. Jak komputer, który po długiej pracy robi pełny restart. Zamyka wszystkie okna. Czyści to, co niepotrzebne.

[pauza 14]

Z każdym wydechem kolejne okno się zamyka. Kolejna sprawa odkłada się na bok.

[pauza 16]

W tym czasie Twoje komórki robią to, co potrafią najlepiej. Odpoczywają. Naprawiają. Odbudowują zapasy.

[pauza 18]

Nie musisz tego kontrolować. Nie musisz pilnować. To dzieje się samo, kiedy jesteś bezpieczny i spokojny. A teraz jesteś.

[pauza 20]

[od 30]
Wyobraź sobie miękkie, ciepłe światło, które powoli przepływa przez ciało. Od czubka głowy, przez twarz, szyję i ramiona. Przez klatkę piersiową i brzuch. Przez nogi, aż do stóp.

[pauza 20]

Tam, gdzie światło przepływa, ciało robi się lżejsze. Czystsze. Odnowione.

[pauza 20]

Teraz przez chwilę nic nie będę mówić. To jest czas głębokiej regeneracji. Pozwól sobie po prostu być.

[pauza 180]

Bardzo dobrze, {imię}.

[pauza 30]
[/od]

[od 15]
Pozostań w tej ciszy. Twój układ nerwowy pracuje teraz dla Ciebie.

[pauza 60]
[/od]

${KOTWICA}

Restart jest prawie zakończony. Za chwilę wrócisz, i zabierzesz ze sobą świeżość, spokój i nową energię. Tak, jakby wszystko w Tobie zostało delikatnie poukładane od nowa.

[pauza 10]

${POWROT}

Twój układ nerwowy zasługuje na takie chwile, {imię}. Możesz do nich wracać, kiedy tylko zechcesz.`;

const nidra = `Cześć, {imię}. To jest joga nidra. Sen świadomości. Ciało głęboko odpoczywa, a uwaga pozostaje delikatnie obecna. Jeśli zaśniesz, to też jest w porządku.

[pauza 5]

Połóż się na plecach. Nogi lekko rozsunięte, stopy opadają na boki. Ręce wzdłuż ciała, dłonie zwrócone ku górze. Jeśli potrzebujesz, podłóż poduszkę pod głowę albo kolana. Okryj się kocem.

[pauza 10]

Zamknij oczy. Poruszaj się jeszcze chwilę, aż znajdziesz pozycję, w której możesz zostać bez ruchu.

[pauza 10]

Od teraz postanawiasz nie poruszać ciałem. Ciało odpoczywa. Ty słuchasz mojego głosu.

[pauza 6]

Weź głęboki wdech. I powoli wypuść powietrze. Jeszcze raz. Głęboki wdech. I długi wydech.

[pauza 10]

Zauważ dźwięki wokół siebie. Te dalekie. I te bliskie. Nie oceniaj ich. Pozwól im przychodzić i odchodzić.

[pauza 12]

Poczuj ciało leżące na podłożu. Całe ciało. Ciężkie i spokojne.

[pauza 10]

${ZEJSCIE}

Teraz czas na Twoje postanowienie. Sankalpę. Krótkie zdanie, prawdziwe dla Ciebie, wypowiedziane w czasie teraźniejszym. Jeśli nie masz własnego, możesz przyjąć to: jestem spokojny, a mój spokój wystarcza.

[pauza 6]

Powtórz je w myślach trzy razy. Powoli. Z pełnym przekonaniem.

[pauza 20]

Bardzo dobrze, {imię}. Postanowienie zostało zasiane. Możesz je teraz zostawić.

[pauza 6]

Teraz przeprowadzę Twoją uwagę przez ciało. Gdy usłyszysz nazwę miejsca, po prostu je poczuj. Nie musisz się ruszać. Tylko uwaga płynie z miejsca na miejsce.

[pauza 4]

Prawa dłoń. Kciuk. Palec wskazujący. Środkowy. Serdeczny. Mały palec. Wnętrze dłoni. Grzbiet dłoni. Nadgarstek. Przedramię. Łokieć. Ramię. Bark. Prawy bok. Biodro. Udo. Kolano. Łydka. Kostka. Pięta. Podeszwa stopy. Palce prawej stopy.

[pauza 6]

Lewa dłoń. Kciuk. Palec wskazujący. Środkowy. Serdeczny. Mały palec. Wnętrze dłoni. Grzbiet dłoni. Nadgarstek. Przedramię. Łokieć. Ramię. Bark. Lewy bok. Biodro. Udo. Kolano. Łydka. Kostka. Pięta. Podeszwa stopy. Palce lewej stopy.

[pauza 6]

[od 15]
Tył ciała. Pięty. Łydki. Tył kolan. Tył ud. Pośladki. Dolna część pleców. Środek pleców. Łopatki. Kark. Tył głowy. Czubek głowy.

[pauza 6]

Przód ciała. Czoło. Prawa brew. Lewa brew. Przestrzeń między brwiami. Prawe oko. Lewe oko. Prawy policzek. Lewy policzek. Nos. Górna warga. Dolna warga. Broda. Gardło. Prawa strona klatki piersiowej. Lewa strona. Środek klatki piersiowej. Brzuch. Pępek. Podbrzusze.

[pauza 6]
[/od]

Całe ciało. Cała prawa strona. Cała lewa strona. Całe ciało naraz. Całe ciało.

[pauza 12]

Bardzo dobrze, {imię}.

[pauza 5]

Teraz uświadom sobie oddech. Naturalny, spokojny oddech. Poczuj, jak powietrze wpływa przez nozdrza, chłodniejsze, i wypływa, cieplejsze.

[pauza 12]

[do 10]
Policz w myślach oddechy, od jedenastu do jednego. Wdech, wydech, jedenaście. Wdech, wydech, dziesięć. I tak dalej, aż do jednego. Jeśli się pomylisz, zacznij spokojnie od początku.

[pauza 60]
[/do]
[od 15]
Policz w myślach oddechy, od dwudziestu siedmiu do jednego. Wdech, wydech, dwadzieścia siedem. Wdech, wydech, dwadzieścia sześć. I tak dalej. Jeśli się pomylisz, zacznij spokojnie od początku. Nie ma tu błędu.

[pauza 120]
[/od]

Zostaw liczenie. Oddech płynie sam.

[pauza 8]

[od 20]
Teraz przywołaj uczucie ciężkości. Całe ciało staje się ciężkie. Bardzo ciężkie. Jakby zapadało się w podłoże. Ręce ciężkie. Nogi ciężkie. Głowa ciężka.

[pauza 20]

A teraz uczucie lekkości. Ciało staje się lekkie. Bardzo lekkie. Jakby unosiło się odrobinę nad podłożem. Lekkie jak piórko.

[pauza 20]

Uczucie ciepła. Jakbyś leżał w słońcu, w ciepły letni dzień. Ciepło na skórze. Ciepło w środku.

[pauza 20]

Uczucie chłodu. Jakbyś stał boso na chłodnej trawie wczesnym rankiem. Chłodne powietrze na twarzy.

[pauza 20]

I zostaw te uczucia. Wróć do zwykłego, spokojnego ciała.

[pauza 10]

Teraz pozwól, żeby przed Twoimi oczami przepływały obrazy. Nie zatrzymuj ich. Tylko zobacz.

[pauza 4]

Spokojne morze o świcie.

[pauza 5]

Płonąca świeca.

[pauza 5]

Śnieżny szczyt góry.

[pauza 5]

Ścieżka w lesie.

[pauza 5]

Kubek gorącej herbaty.

[pauza 5]

Śmiejące się dzieci.

[pauza 5]

Ognisko w nocy.

[pauza 5]

Gwiaździste niebo.

[pauza 5]

Leżak na ciepłej plaży.

[pauza 5]

Spokojna twarz kogoś bliskiego.

[pauza 8]

Teraz wyobraź sobie bezkresne, ciemne, spokojne niebo. Przestrzeń bez końca. Odpoczywaj w niej.

[pauza 30]
[/od]

[od 30]
Bądź teraz świadkiem wszystkiego, co się pojawia. Myśli, obrazy, odczucia. Pozwól im przepływać. Ty po prostu jesteś.

[pauza 180]
[/od]

Wróć do swojego postanowienia. Tego samego, które wypowiedziałeś na początku. Powtórz je w myślach trzy razy. Z pełnym przekonaniem. Teraz trafia na bardzo podatny grunt.

[pauza 20]

Bardzo dobrze, {imię}.

[pauza 6]

Joga nidra dobiega końca. Uświadom sobie oddech. Ciało leżące na podłożu. Dźwięki w pomieszczeniu.

[pauza 10]

Zacznij delikatnie poruszać palcami dłoni i stóp. Przeciągnij się powoli, jeśli masz ochotę.

[pauza 10]

Kiedy będziesz gotowy, przekręć się na prawy bok i poleż tak chwilę. A potem powoli usiądź i otwórz oczy.

[pauza 10]

Joga nidra zakończona, {imię}.`;

const evening = `Dobry wieczór, {imię}. Dzień pracy jest już za Tobą. Teraz możesz go powoli odłożyć.

[pauza 5]

${INDUKCJA}

${ZEJSCIE}

${POGLEBIENIE}

Twoje ciało może wciąż nosić w sobie trochę dnia. Rozmowy. Decyzje. Ekrany. To naturalne. I z każdym wydechem ten dzień może odpływać coraz dalej.

[pauza 12]

Przypomnij sobie jedną rzecz, którą dziś zrobiłeś. Nie musi być duża. Wystarczy, że się wydarzyła. Możesz ją docenić.

[pauza 14]

A teraz wyobraź sobie, że wszystko, co zostało niedokończone, wkładasz do pudełka. Jedna sprawa. Druga. Trzecia. Zamykasz pokrywę. Pudełko stoi na biurku. Poczeka do jutra.

[pauza 16]

Nie musisz go pilnować w nocy. Bardzo dobrze, {imię}.

[pauza 10]

[od 20]
Wyobraź sobie teraz cichą windę. Drzwi otwierają się, wchodzisz do środka. Ściany są miękkie, światło ciepłe i przytłumione.

[pauza 8]

Winda zjeżdża powoli w dół. Piętro pod piętrem. Z każdym piętrem dzień jest dalej, a spokój bliżej.

[pauza 14]

Drzwi otwierają się na dole. Za nimi jest przestrzeń wieczornego spokoju. Ciepła. Cicha. Twoja.

[pauza 16]
[/od]

Jeśli coś jeszcze krąży w głowie, możesz to nazwać jednym słowem. Decyzja. Rozmowa. Pomysł. Nazwane myśli robią się cichsze. Jak chmury, które przepływają po wieczornym niebie.

[pauza 18]

Na dzisiaj wystarczy, {imię}. Zrobiłeś dość. Jesteś wystarczający, także wtedy, kiedy nic nie robisz.

[pauza 20]

Pomyśl przez chwilę o swoich bliskich. O Monice. O Leonie i Gai. Nie musisz niczego planować. Wystarczy, że poczujesz, że są blisko. Że ten dom jest spokojnym miejscem.

[pauza 22]

[od 15]
Każdy wydech pozwala Ci zapaść się odrobinę głębiej w miękkość łóżka albo fotela. Głębiej i głębiej. Noc zajmie się resztą.

[pauza 30]
[/od]

[od 30]
Teraz przez dłuższą chwilę nic nie będę mówić. Możesz po prostu odpływać. Spokojnie. Coraz dalej.

[pauza 180]
[/od]

${POWROT_SEN}

Dobranoc, {imię}.`;

const estepona = `{imię}, ta wizualizacja zabierze Cię w znajome miejsce. Nie musisz niczego dokładnie wyobrażać. Wystarczy, że pozwolisz obrazom przychodzić tak, jak chcą.

[pauza 5]

${INDUKCJA}

Jest późne przedpołudnie w Esteponie. Stoisz na górze drewnianych schodków, które prowadzą na plażę. Dziesięć ciepłych stopni w dół, do piasku.

[pauza 6]

Schodzisz powoli. Dziesięć. Dziewięć. Osiem. Z każdym stopniem słońce grzeje mocniej, a ciało robi się cięższe.

[pauza 6]

Siedem. Sześć. Pięć. Słyszysz morze coraz wyraźniej.

[pauza 6]

Cztery. Trzy. Dwa. Jeden. Twoje stopy dotykają ciepłego piasku. Bardzo dobrze, {imię}.

[pauza 8]

${POGLEBIENIE}

Kładziesz się na leżaku. Pod plecami czujesz miękki materiał. Ciało jest ciężkie i rozgrzane.

[pauza 12]

Słońce dotyka Twojej skóry. Najpierw twarzy. Potem ramion. Potem nóg. Ciepło jest przyjemne, nie za mocne. Rozlewa się powoli po całym ciele.

[pauza 16]

Słyszysz fale. Przychodzą i odchodzą. Z każdą falą, która cofa się po piasku, możesz zapaść się odrobinę głębiej.

[pauza 18]

Gdzieś niedaleko słychać śmiech dzieci. Może to Leon. Może Gaja. Monika leży obok z książką. Czasem coś powie, czasem jest cicho. Wszystko jest na swoim miejscu.

[pauza 18]

Twój telefon leży głęboko w torbie. Nie ma takiej wiadomości, która nie mogłaby poczekać.

[pauza 14]

[od 20]
Wstajesz powoli i idziesz w stronę wody. Morze jest ciepłe, przejrzyste. Wchodzisz do niego krok po kroku.

[pauza 10]

Kładziesz się na plecach. Woda Cię niesie. Nie musisz nic robić. Morze trzyma Cię całego.

[pauza 16]

Kołyszesz się delikatnie na falach. Nad Tobą błękitne niebo. Każde kołysanie zabiera Cię głębiej w spokój.

[pauza 20]

A potem wracasz powoli na brzeg i kładziesz się z powrotem na leżaku. Ciepły. Lekki. Spokojny.

[pauza 14]
[/od]

Zauważ, {imię}, jak to jest nie potrzebować niczego więcej. Nic nie trzeba poprawić. Nic nie trzeba zbudować. Nic nie trzeba zdobyć.

[pauza 22]

Przypomnij sobie, ile wysiłku kosztowało dojście do tego miejsca. Ile decyzji, ile pracy, ile odwagi. Teraz to wszystko może zostać za Tobą. Jak droga, którą przeszedłeś, żeby dotrzeć na plażę.

[pauza 18]

Zbudowałeś coś, z czego możesz się cieszyć. Enjoy what you've built.

[pauza 18]

To uczucie ma swój adres w Twoim ciele. Może jest w rozluźnionych barkach. Może w ciepłym brzuchu. Może w miękkiej twarzy. Zauważ, gdzie go czujesz.

[pauza 18]

${KOTWICA}

Możesz do niego wracać, kiedy zechcesz, {imię}. Nie tylko w Hiszpanii. Także w zwykły wtorek po pracy. Na kanapie. W samochodzie, czekając na dzieci.

[pauza 16]

[od 30]
Zostań teraz na leżaku. Słońce. Morze. Rodzina obok. Ja przez chwilę nic nie będę mówić.

[pauza 180]
[/od]

Słońce. Morze. Spokój, który nie musi być niczym więcej.

[pauza 40]

${POWROT}

Mam prawo cieszyć się tym, co już zbudowałem.`;

const jacobson = `Cześć, {imię}. To jest relaksacja mięśni według Jacobsona, połączona z głębokim wyciszeniem.

Będziemy po kolei lekko napinać i rozluźniać kolejne części ciała. Napięcie ma być delikatne, mniej więcej na trzydzieści procent siły. Nigdy do bólu. Jeśli jakaś część ciała jest obolała, pomiń ją i tylko wyobraź sobie rozluźnienie.

[pauza 6]

${INDUKCJA}

Za każdym razem, kiedy usłyszysz słowa „i puść”, rozluźnij mięśnie od razu, całkowicie. A potem obserwuj, co dzieje się w tym miejscu. Ciepło. Ciężar. Mrowienie. Każde odczucie jest w porządku.

[pauza 8]

[do 10]
Zaciśnij delikatnie obie dłonie w pięści i napnij ramiona.

[pauza 5]

I puść. Ręce opadają, ciężkie i ciepłe. Bardzo dobrze.

[pauza 18]

Unieś barki w stronę uszu i lekko zmarszcz twarz.

[pauza 5]

I puść. Barki opadają niżej niż przedtem. Twarz się wygładza.

[pauza 18]

Napnij lekko brzuch i ściągnij łopatki do siebie.

[pauza 5]

I puść. Brzuch mięknie. Plecy rozkładają się szeroko.

[pauza 18]

Wyprostuj nogi i delikatnie przyciągnij palce stóp do siebie.

[pauza 5]

I puść. Nogi stają się ciężkie. Całe ciało jest teraz luźne. Bardzo dobrze, {imię}.

[pauza 20]
[/do]
[od 15]
Zaczynamy od dłoni. Zaciśnij delikatnie obie dłonie w pięści. Poczuj napięcie w dłoniach i przedramionach.

[pauza 5]

I puść. Pozwól dłoniom się otworzyć. Zauważ różnicę między napięciem a rozluźnieniem.

[pauza 20]

Teraz ramiona. Zegnij ręce w łokciach i delikatnie napnij mięśnie ramion.

[pauza 5]

I puść. Ręce opadają swobodnie. Ciężkie i ciepłe.

[pauza 20]

Barki. Unieś barki w stronę uszu. Delikatnie.

[pauza 5]

I opuść. Pozwól im opaść niżej, niż były na początku. Bardzo dobrze.

[pauza 20]

Twarz. Zmarszcz lekko czoło i zaciśnij delikatnie powieki.

[pauza 5]

I puść. Czoło się wygładza. Oczy odpoczywają.

[pauza 18]

Zaciśnij lekko zęby i poczuj napięcie w szczęce.

[pauza 5]

I puść. Zęby się rozsuwają. Język leży swobodnie. To miejsce, w którym wiele osób nosi napięcie dnia.

[pauza 20]

Kark. Bardzo delikatnie dociśnij tył głowy do podłoża albo oparcia.

[pauza 5]

I puść. Szyja może odpocząć.

[pauza 20]

Plecy. Ściągnij delikatnie łopatki do siebie.

[pauza 5]

I puść. Plecy rozkładają się szeroko. Głębiej i spokojniej.

[pauza 20]

Brzuch. Napnij lekko mięśnie brzucha.

[pauza 5]

I puść. Brzuch staje się miękki. Oddech płynie swobodnie.

[pauza 20]

Pośladki i uda. Napnij je delikatnie.

[pauza 5]

I puść. Miednica i nogi opadają ciężko w stronę podłoża.

[pauza 20]

Łydki i stopy. Delikatnie przyciągnij palce stóp w swoją stronę. Bez skurczu, tylko odrobinę.

[pauza 5]

I puść. Stopy opadają swobodnie. Bardzo dobrze, {imię}.

[pauza 22]
[/od]

${ZEJSCIE}

Teraz przejdź uwagą przez całe ciało, od stóp do głowy. Jeśli gdzieś zostało trochę napięcia, nie walcz z nim. Z każdym wydechem może odpuścić samo.

[pauza 24]

[od 20]
Wyobraź sobie, że ciało jest jak ciężki, ciepły koc, który powoli rozkłada się na podłożu. Każdy mięsień jest miękki. Każdy staw luźny.

[pauza 20]

I im bardziej ciało się rozluźnia, tym spokojniejszy staje się umysł. Jedno prowadzi do drugiego. Samo.

[pauza 20]
[/od]

${POGLEBIENIE}

Całe ciało jest ciężkie i spokojne, {imię}. Podłoże niesie Cię w całości.

[pauza 30]

${KOTWICA}

[od 30]
Zostań teraz w tym rozluźnieniu. Nic nie musisz. Ja przez chwilę nic nie będę mówić.

[pauza 180]
[/od]

Zostań jeszcze chwilę w tym uczuciu.

[pauza 40]

${POWROT}

Dziękuję, {imię}.`;

const ideas = `{imię}, ta sesja jest na chwile, w których pojawia się nowy pomysł i od razu czujesz, że chcesz zacząć. Daj sobie te kilka minut. Pomysł poczeka.

[pauza 4]

${INDUKCJA}

${ZEJSCIE}

Zauważ teraz, co dzieje się w ciele, kiedy myślisz o tym pomyśle. Może jest tam ekscytacja. Lekkie przyspieszenie. Energia, która chce się gdzieś ruszyć. To przyjemne uczucie. Nie ma w nim nic złego.

[pauza 12]

Pozwól mu po prostu być. Bez wykonywania żadnego ruchu. Bardzo dobrze.

[pauza 12]

Ekscytacja często przychodzi razem z myślą: teraz albo nigdy. Ta myśl brzmi przekonująco, ale rzadko jest prawdziwa. Dobre pomysły nie psują się w ciągu jednej nocy. Często po kilku dniach są nawet lepsze, bo zdążyły dojrzeć.

[pauza 16]

Z każdym wydechem ta energia może opadać, jak fala, która uspokaja się przy brzegu. Coraz niżej. Coraz łagodniej.

[pauza 16]

Twój umysł jest świetny w znajdowaniu możliwości. Dzięki temu zbudowałeś tak wiele. Ale nie każda możliwość wymaga realizacji, {imię}. To, że coś możesz zrobić, nie oznacza, że musisz. I nie oznacza, że musisz dzisiaj.

[pauza 16]

Wyobraź sobie, że Twój pomysł zapisujesz na małej kartce. Jednym zdaniem. Składasz ją i kładziesz w bezpiecznym miejscu. Na półce, w szufladzie, w parkingu pomysłów.

[pauza 10]

Pomysł jest bezpieczny. Nie zniknie. Będzie tam, kiedy zechcesz do niego wrócić. Może za tydzień. Może w grudniu. Może okaże się, że już go nie potrzebujesz. To też jest dobre zakończenie.

[pauza 18]

[od 15]
Wyobraź sobie port wieczorem. Przy nabrzeżu stoją łodzie. Każda z nich to jeden z Twoich pomysłów. Kołyszą się spokojnie, bezpiecznie przycumowane.

[pauza 14]

Możesz na nie patrzeć z brzegu. Możesz je podziwiać. I nie musisz żadną z nich wypływać. Port jest po to, żeby łodzie mogły czekać.

[pauza 16]
[/od]

[od 20]
Teraz zwróć się do tej części siebie, która kocha tworzyć. Podziękuj jej. Za energię. Za odwagę. Za wszystko, co dzięki niej powstało.

[pauza 14]

I zapytaj ją spokojnie: czy możesz teraz odpocząć, wiedząc, że pomysły są bezpieczne?

[pauza 18]

Może poczujesz ulgę. Może lekkość. Ta część Ciebie też zasługuje na wakacje.

[pauza 16]
[/od]

Zapytaj siebie spokojnie: czy chcę teraz świadomie tworzyć? Czy może automatycznie wypełniam wolny czas kolejnym projektem?

[pauza 18]

Obie odpowiedzi są w porządku. Ważne jest tylko to, że wybierasz Ty, a nie ekscytacja.

[pauza 12]

I od teraz, za każdym razem, kiedy pojawi się nowy pomysł, Twoje ciało samo zrobi krótką pauzę. Jeden spokojny oddech. Jedno zdanie zapisane na kartce. I powrót do swojego dnia. Coraz łatwiej. Coraz naturalniej.

[pauza 14]

Mogę odczuwać ekscytację i nie podejmować działania.

[pauza 10]

Nie każda myśl wymaga działania.

[pauza 10]

Nie muszę dzisiaj budować kolejnego miasta.

[pauza 16]

${KOTWICA}

[od 30]
Zostań teraz chwilę w ciszy. Bez planów. Bez projektów. Tylko oddech.

[pauza 150]
[/od]

${POWROT}

Pomysł poczeka. Ty możesz żyć dalej, {imię}.`;

const morning = `Dzień dobry, {imię}. Zanim zaczniesz dzień, daj sobie tę chwilę. Bez telefonu. Bez listy zadań.

[pauza 4]

Jeśli masz przed sobą kawę, poczuj jeszcze ciepło kubka w dłoniach. A potem odstaw go i ułóż się wygodnie.

[pauza 6]

${INDUKCJA}

${ZEJSCIE}

Zauważ, jak jest teraz w Twoim ciele. Może jesteś jeszcze trochę zaspany. Może głowa już zaczyna planować. Cokolwiek tam jest, możesz to po prostu zauważyć.

[pauza 12]

{imię}, dzisiaj możesz działać z ciekawością, ale bez pośpiechu. Nie musisz zrobić wszystkiego. Wystarczy, że zrobisz to, co ważne. I zrobisz to spokojnie.

[pauza 14]

Wybierz jedną, najważniejszą rzecz na dzisiaj. Tylko jedną. Resztę potraktuj jako dodatek, a nie obowiązek.

[pauza 14]

[od 15]
Wyobraź sobie teraz swój dzień, jakbyś oglądał go na spokojnym filmie. Widzisz siebie przy pracy. Skupionego. Spokojnego. Robisz jedną rzecz naraz.

[pauza 14]

Widzisz moment, w którym pojawia się nowy pomysł. Zauważasz go. Zapisujesz jednym zdaniem. I wracasz do tego, co robiłeś. Lekko. Bez napięcia.

[pauza 14]

Widzisz, jak około szesnastej zamykasz pracę. Nawet jeśli nie wszystko jest gotowe. I wracasz do domu, do Moniki, do Leona i Gai. Obecny. Spokojny.

[pauza 16]

Bardzo dobrze, {imię}. Ten dzień już się zaczyna dobrze.

[pauza 8]
[/od]

[od 20]
Wyobraź sobie teraz poranne światło, które powoli wpływa do ciała. Ciepłe, jasne. Wchodzi przez czubek głowy i rozlewa się dalej. Przez twarz. Przez ramiona. Przez klatkę piersiową.

[pauza 14]

Tam, gdzie płynie, budzi spokojną energię. Nie pośpiech. Nie napięcie. Tylko świeżość i gotowość.

[pauza 16]
[/od]

Pomyśl przez chwilę o jednej rzeczy, na którą możesz się dzisiaj cieszyć. Nie musi być wielka. Spacer. Rozmowa z Moniką. Kolacja z dziećmi. Ciepła herbata wieczorem.

[pauza 18]

Twój dzień ma początek. Ma też koniec. I każda jego chwila może być trochę spokojniejsza, niż się spodziewasz.

[pauza 12]

${KOTWICA}

[od 30]
Zostań teraz chwilę w ciszy. Niech ten spokój dobrze się zakorzeni, zanim zaczniesz dzień.

[pauza 150]
[/od]

${POWROT}

Kiedy będziesz gotowy, możesz uruchomić START. Albo po prostu dopić kawę. Miłego dnia, {imię}.`;

const present = `{imię}, zatrzymaj się na chwilę. Nie musisz niczego kończyć, zanim zaczniesz.

[pauza 4]

Poczuj stopy na podłodze. Poczuj, gdzie ciało dotyka krzesła albo ziemi.

[pauza 8]

Rozejrzyj się powoli. Znajdź wzrokiem trzy rzeczy, które widzisz. Nazwij je w myślach.

[pauza 12]

Teraz posłuchaj. Jakie dwa dźwięki słyszysz? Jeden blisko i jeden daleko.

[pauza 12]

Poczuj jedną rzecz pod palcami. Fakturę. Temperaturę.

[pauza 10]

Bardzo dobrze, {imię}. Jesteś tutaj.

[pauza 5]

${INDUKCJA}

${ZEJSCIE}

Zauważ swoje barki. Jeśli są uniesione, pozwól im opaść. Zauważ szczękę. Jeśli jest zaciśnięta, pozwól jej się rozluźnić.

[pauza 12]

Jesteś tutaj, {imię}. W tym miejscu. W tej chwili. Ta chwila nie potrzebuje ulepszenia.

[pauza 16]

[od 15]
Przeszłość jest za Tobą. Przyszłość poczeka. Teraz jest tylko ten oddech. I następny.

[pauza 16]

Z każdym wdechem jesteś bardziej tutaj. Z każdym wydechem spokojniej.

[pauza 18]
[/od]

${POGLEBIENIE}

${KOTWICA}

[od 30]
Zostań w tej chwili. Ja przez dłuższy moment nic nie będę mówić.

[pauza 180]
[/od]

[pauza 20]

${POWROT}

Możesz wrócić do swojego dnia. Wolniej niż przed chwilą.`;

export const AUDIO_SESSIONS: AudioSessionDef[] = [
  {
    id: "demob",
    title: "Głęboka demobilizacja",
    minutes: 15,
    description: "Po długim okresie mobilizacji. Zejście w spokój, ciało, oddech i leżak w Esteponie.",
    suggestedMotif: "close",
    suggestedBackground: "nature",
    script: demob,
  },
  {
    id: "restart",
    title: "Deep Restart",
    minutes: 20,
    description: "Restart i regeneracja układu nerwowego: oddech, ciężar, ciepło, bezpieczeństwo, odnowa.",
    suggestedMotif: "close",
    suggestedBackground: "orchestral",
    script: restart,
  },
  {
    id: "nidra",
    title: "Joga nidra",
    minutes: 20,
    description: "Sen świadomości: postanowienie, podróż przez ciało, oddech, przeciwieństwa i obrazy.",
    suggestedMotif: "none",
    suggestedBackground: "none",
    script: nidra,
  },
  {
    id: "evening",
    title: "Wieczorne odpuszczanie",
    minutes: 15,
    description: "Odkładanie dnia i miękkie przejście w sen.",
    suggestedMotif: "close",
    suggestedBackground: "orchestral",
    script: evening,
  },
  {
    id: "estepona",
    title: "Leżak w Esteponie",
    minutes: 15,
    description: "Wizualizacja: schodki na plażę, słońce, morze i nic więcej do zrobienia.",
    suggestedMotif: "none",
    suggestedBackground: "nature",
    script: estepona,
  },
  {
    id: "jacobson",
    title: "Relaksacja Jacobsona",
    minutes: 15,
    description: "Łagodne napinanie i rozluźnianie mięśni, potem głębokie wyciszenie.",
    suggestedMotif: "none",
    suggestedBackground: "nature",
    script: jacobson,
  },
  {
    id: "ideas",
    title: "Nie muszę realizować każdego pomysłu",
    minutes: 10,
    description: "Kiedy ekscytacja ciągnie do kolejnego projektu.",
    suggestedMotif: "none",
    suggestedBackground: "system",
    script: ideas,
  },
  {
    id: "morning",
    title: "Spokojny poranek",
    minutes: 10,
    description: "Spokojny start i dzień przeżyty z wyprzedzeniem — bez pośpiechu.",
    suggestedMotif: "start",
    suggestedBackground: "jazz",
    script: morning,
  },
  {
    id: "present",
    title: "Powrót do chwili obecnej",
    minutes: 10,
    description: "Uziemienie zmysłami i krótkie zejście w spokój w środku dnia.",
    suggestedMotif: "none",
    suggestedBackground: "none",
    script: present,
  },
];

export const AUDIO_BY_ID: Record<string, AudioSessionDef> = Object.fromEntries(AUDIO_SESSIONS.map((s) => [s.id, s]));

export function personalize(script: string, forms: NameForms): string {
  return fillName(script, forms);
}
