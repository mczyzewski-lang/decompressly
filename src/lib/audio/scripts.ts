import { fillName, type NameForms } from "../names";

/**
 * Original guided-relaxation scripts. "{imię}" becomes the vocative form of the name ("Marku"),
 * "{imię_m}" the nominative ("Marek") — both configurable in Settings.
 * Inspired by relaxation and gentle hypnosis language, but not a clinical treatment.
 */
export interface AudioSessionDef {
  id: string;
  title: string;
  minutes: number;
  description: string;
  suggestedMotif: "start" | "close" | "none";
  suggestedBackground: "nature" | "jazz" | "system" | "orchestral" | "none";
  script: string;
}

const demob = `Cześć, {imię}.

Usiądź albo połóż się tak, żeby ciało miało pełne podparcie. Nie musisz układać się idealnie. Wystarczy, że jest wygodnie.

Jeśli chcesz, zamknij oczy. Jeśli wolisz, zostaw je półotwarte i patrz miękko w jeden punkt.

[pauza 6]

To jest ten czas, {imię}. Przez najbliższe kilkanaście minut nie masz nic do zrobienia. Nie ma tu zadania. Nie ma dobrego ani złego wykonania. Możesz po prostu słuchać, a jeśli myśli odpłyną gdzieś dalej, to też jest w porządku.

[pauza 11]

Zauważ, jak oddychasz. Nie zmieniaj niczego. Oddech płynie sam, tak jak płynął przez cały dzień, kiedy nie zwracałeś na niego uwagi.

[pauza 14]

Teraz pozwól, żeby wydech był odrobinę dłuższy. Bez wysiłku. Tak, jakbyś powoli wypuszczał powietrze po długim dniu.

[pauza 17]

{imię}, przez ostatnie miesiące wiele od siebie wymagałeś.

Podejmowałeś decyzje.

Budowałeś.

Rozwiązywałeś trudne problemy.

[pauza 4]

Brałeś na siebie odpowiedzialność, kiedy nie było jeszcze wiadomo, jak to wszystko się skończy. Byłeś czujny. Byłeś gotowy. Twoje ciało i Twoja uwaga długo pracowały w trybie mobilizacji.

[pauza 6]

Teraz możesz dać sobie chwilę, {imię}.

[pauza 5]

Nie musisz natychmiast zaczynać kolejnego projektu.

[pauza 3]

Twoja kreatywność nigdzie nie znika.

[pauza 3]

Twoje możliwości nie znikają.

[pauza 3]

Możesz pozwolić sobie odpocząć.

[pauza 21]

Przenieś uwagę na twarz. Na czoło. Pozwól, żeby czoło stało się gładkie i szerokie.

[pauza 6]

Okolice oczu. Powieki mogą być ciężkie. Oczy nie muszą niczego wypatrywać.

[pauza 6]

Szczęka. Pozwól zębom lekko się rozsunąć. Język może swobodnie leżeć.

[pauza 11]

Barki. Zauważ, czy nie są uniesione choć trochę. Jeśli są, pozwól im opaść. Jeszcze odrobinę. Nie trzeba ich dźwigać.

[pauza 14]

Ręce stają się cięższe. Dłonie mogą się otworzyć.

[pauza 11]

Klatka piersiowa i brzuch poruszają się w rytm oddechu. Brzuch może być miękki. Nie musisz go trzymać.

[pauza 14]

Plecy opierają się o podłoże. Pozwól, żeby to podłoże Cię niosło. Nie musisz się trzymać.

[pauza 11]

Zauważ, że nie musisz robić rozluźnienia. Ono dzieje się samo, kiedy przestajesz się pilnować. Ciało dobrze wie, jak odpoczywać. Czasem potrzebuje tylko pozwolenia.

[pauza 14]

Nogi. Uda, kolana, łydki, stopy. Ciężkie i spokojne.

[pauza 21]

Wyobraź sobie leżak w Esteponie.

[pauza 3]

Czujesz przyjemne ciepło słońca.

[pauza 3]

Słyszysz morze.

[pauza 5]

Nie masz potrzeby sprawdzania wiadomości.

[pauza 3]

Nie musisz podejmować żadnej decyzji.

[pauza 5]

Za chwilę możesz pójść na spacer z Leonem.

Możesz zjeść coś dobrego.

Możesz po prostu zostać tutaj.

[pauza 28]

Poczuj, jak słońce rozgrzewa Twoją twarz. Jak ciepło schodzi na ramiona, na klatkę piersiową, na brzuch. Fale przychodzą i odchodzą. Nikt niczego od Ciebie nie oczekuje.

[pauza 28]

To uczucie nie musi pojawiać się tylko w Hiszpanii.

[pauza 3]

Możesz stopniowo uczyć się odnajdywać je również w zwykłych dniach. Przy porannej kawie. W drodze do domu. Wieczorem, kiedy Gaja opowiada Ci o swoim dniu.

[pauza 5]

Nie musisz się do tego zmuszać.

[pauza 3]

Nie musisz sprawdzać, czy już jesteś zrelaksowany.

[pauza 4]

Możesz po prostu być, {imię}.

[pauza 42]

Jeśli pojawi się myśl o pracy, o pomyśle, o czymś, co można by zbudować, możesz ją zauważyć. Możesz powiedzieć jej w myślach: dziękuję, zapiszę cię później. I wrócić do słońca. Do dźwięku morza. Do ciężaru ciała.

[pauza 35]

Twoje pomysły są jak łodzie zacumowane w porcie. Są bezpieczne. Nikt ich nie zabierze. Możesz na nie patrzeć z brzegu i nie musisz żadną z nich wypływać. Dzisiaj możesz po prostu siedzieć na plaży.

[pauza 28]

Przez dziewięć miesięcy byłeś na wojnie. Teraz ta wojna dobiega końca. Nie musisz od razu budować kolejnego miasta. Możesz wrócić do domu. Możesz cieszyć się pokojem.

[pauza 14]

Enjoy what you've built.

[pauza 84]

Zostań w tej ciszy jeszcze chwilę. Nic się nie dzieje i nic nie musi się dziać.

[pauza 84]

{imię}, powoli zacznij wracać. Nie spiesz się.

[pauza 4]

Weź jeden głębszy, ale wygodny oddech.

[pauza 6]

Poruszaj palcami dłoni. Palcami stóp. Jeśli masz ochotę, przeciągnij się.

[pauza 11]

Kiedy będziesz gotowy, otwórz oczy. Zabierz ze sobą trochę tego spokoju. Nie musisz go pilnować. Wystarczy, że wiesz, gdzie go szukać.

[pauza 4]

Na dzisiaj wystarczy, {imię}.`;

const ideas = `{imię}, ta krótka sesja jest na chwile, w których pojawia się nowy pomysł i od razu czujesz, że chcesz zacząć.

Usiądź wygodnie. Połóż jedną dłoń na brzuchu albo na klatce piersiowej.

[pauza 5]

Zauważ, co się teraz dzieje w ciele. Może jest tam ekscytacja. Lekkie przyspieszenie. Energia, która chce się gdzieś ruszyć. To przyjemne uczucie. Nie ma w nim nic złego.

[pauza 13]

Pozwól mu po prostu być, bez wykonywania żadnego ruchu.

[pauza 16]

Ekscytacja często przychodzi razem z myślą: teraz albo nigdy. Ta myśl brzmi przekonująco, ale rzadko jest prawdziwa. Dobre pomysły nie psują się w ciągu jednej nocy. Często po kilku dniach są nawet lepsze, bo zdążyły dojrzeć.

[pauza 19]

Wydłuż odrobinę wydech. Jakbyś wypuszczał powietrze przez lekko uchylone usta. Spokojnie. Bez pośpiechu.

[pauza 19]

Twój umysł jest świetny w znajdowaniu możliwości. To jedna z rzeczy, które w sobie lubisz. Dzięki temu zbudowałeś tak wiele.

[pauza 4]

Ale nie każda możliwość wymaga realizacji, {imię}.

[pauza 6]

To, że coś możesz zrobić, nie oznacza, że musisz. I nie oznacza, że musisz dzisiaj.

[pauza 16]

Wyobraź sobie, że Twój pomysł zapisujesz na małej kartce. Jednym zdaniem. Składasz ją i kładziesz w bezpiecznym miejscu. Na półce, w szufladzie, w parkingu pomysłów.

[pauza 6]

Pomysł jest bezpieczny. Nie zniknie. Będzie tam, kiedy zechcesz do niego wrócić. Może za tydzień. Może w grudniu. Może okaże się, że już go nie potrzebujesz. To też jest dobre zakończenie.

[pauza 24]

Teraz zauważ, co jest wokół Ciebie. Jakie dźwięki słyszysz. Co czujesz pod stopami.

[pauza 16]

Zapytaj siebie spokojnie: czy chcę teraz świadomie tworzyć? Czy może automatycznie wypełniam wolny czas kolejnym projektem?

[pauza 24]

Obie odpowiedzi są w porządku. Ważne jest tylko to, że wybierasz Ty, a nie ekscytacja.

[pauza 16]

Jeśli wybierasz odpoczynek, możesz poczuć ulgę. Nic nie tracisz. Twoja kreatywność nie zniknie przez kilka dni, ani przez miesiąc odpoczynku.

[pauza 19]

Pomyśl, co mógłbyś dzisiaj zrobić zamiast tego. Coś, co nie ma celu. Spacer bez trasy. Rozmowa bez tematu. Kilka minut na kanapie z Leonem albo z Gają. Herbata przy oknie.

[pauza 24]

Mogę odczuwać ekscytację i nie podejmować działania.

[pauza 13]

Nie każda myśl wymaga działania.

[pauza 13]

Nie muszę dzisiaj budować kolejnego miasta.

[pauza 32]

Weź jeszcze jeden spokojny oddech z dłuższym wydechem.

[pauza 16]

Wróć do tego, co robiłeś wcześniej. Albo do niczego. Możesz też po prostu pójść do rodziny.

[pauza 4]

Pomysł poczeka. Ty możesz żyć dalej, {imię}.`;

const morning = `Dzień dobry, {imię}.

Zanim zaczniesz dzień, daj sobie kilka minut. Bez telefonu. Bez listy zadań.

[pauza 5]

Jeśli masz przed sobą kawę, poczuj ciepło kubka w dłoniach. Zauważ zapach. Pierwszy łyk może być powolny.

[pauza 20]

Poczuj, jak siedzisz. Stopy na podłodze. Ciężar ciała na krześle.

[pauza 14]

Weź kilka spokojnych oddechów. Wdech nosem. Wydech odrobinę dłuższy. Nie musisz oddychać głęboko. Wystarczy wygodnie.

[pauza 26]

Zauważ, jak jest teraz w Twoim ciele. Może jesteś jeszcze trochę zaspany. Może głowa już zaczyna planować. Cokolwiek tam jest, możesz to po prostu zauważyć. Nie trzeba tego zmieniać.

[pauza 20]

Rozluźnij barki. Rozluźnij twarz. Pozwól szczęce lekko opaść.

[pauza 17]

{imię}, dzisiaj możesz działać z ciekawością, ale bez pośpiechu.

[pauza 6]

Nie musisz zrobić wszystkiego. Wystarczy, że zrobisz to, co ważne, i zrobisz to spokojnie.

[pauza 17]

Możesz wybrać jedną, najważniejszą rzecz na dzisiaj. Tylko jedną. Resztę potraktuj jako dodatek, a nie obowiązek. Jeśli pojawi się nowy pomysł, zapiszesz go i wrócisz do swojego dnia.

[pauza 20]

Pomyśl przez chwilę o jednej rzeczy, na którą możesz się dzisiaj cieszyć. Nie musi być wielka. Spacer. Rozmowa z Moniką. Kolacja z dziećmi. Ciepła herbata wieczorem.

[pauza 26]

Twój dzień ma początek. Ma też koniec. Około szesnastej możesz zamknąć pracę i wrócić do domu, nawet jeśli nie wszystko będzie gotowe.

[pauza 14]

Weź jeszcze jeden oddech.

[pauza 6]

Kiedy będziesz gotowy, możesz uruchomić START. Albo po prostu dopić kawę.

[pauza 3]

Miłego dnia, {imię}.`;

const evening = `Dobry wieczór, {imię}.

Dzień pracy jest już za Tobą. Teraz możesz powoli go odłożyć.

Połóż się albo usiądź wygodnie. Pozwól, żeby światło wokół było przyciemnione.

[pauza 10]

Zauważ, że Twoje ciało wciąż może nosić w sobie trochę dnia. Rozmowy. Decyzje. Ekrany. To naturalne. Nie musisz się tego od razu pozbywać.

[pauza 12]

Zacznij od oddechu. Wdech spokojny. Wydech trochę dłuższy, jakbyś powoli wypuszczał powietrze z balonu.

[pauza 18]

Przypomnij sobie jedną rzecz, którą dziś zrobiłeś. Nie musi być duża. Wystarczy, że się wydarzyła. Możesz ją docenić.

[pauza 15]

A teraz pomyśl o tym, co zostało niedokończone. Wyobraź sobie, że wkładasz te sprawy do pudełka. Zamykasz pokrywę. Pudełko stoi na biurku. Poczeka do jutra.

[pauza 15]

Nie musisz go pilnować w nocy.

[pauza 18]

Jeśli coś jeszcze krąży w głowie, możesz to nazwać jednym słowem. Na przykład: decyzja. Albo: rozmowa. Albo: pomysł. Nazwane myśli często robią się cichsze. Nie trzeba ich teraz rozwiązywać.

[pauza 18]

Przenieś uwagę na stopy. Pozwól im zrobić się ciężkimi i ciepłymi.

[pauza 10]

Łydki i kolana. Miękkie.

[pauza 10]

Uda i biodra. Opadają w stronę podłoża.

[pauza 10]

Brzuch. Może poruszać się swobodnie, razem z oddechem.

[pauza 12]

Plecy. Każdy oddech pozwala im rozłożyć się trochę szerzej.

[pauza 12]

Barki opadają. Ręce są ciężkie. Dłonie otwarte.

[pauza 12]

Szyja. Twarz. Czoło. Szczęka luźna. Oczy odpoczywają.

[pauza 24]

Jeśli pojawiają się myśli o jutrze, możesz je zauważyć i pozwolić im przepłynąć. Jak chmury. Nie musisz za nimi iść.

[pauza 37]

Na dzisiaj wystarczy, {imię}.

[pauza 12]

Zrobiłeś dość, {imię}. Jesteś wystarczający, także wtedy, kiedy nic nie robisz.

[pauza 49]

Pomyśl przez chwilę o swoich bliskich. O Monice. O Leonie i Gai. Nie musisz niczego planować. Wystarczy, że poczujesz, że są blisko. Że ten dom jest spokojnym miejscem.

[pauza 37]

Każdy wydech pozwala Ci zapaść się odrobinę głębiej w miękkość łóżka albo fotela. Nie musisz niczego pilnować. Noc zajmie się resztą.

[pauza 49]

Pozostań w tym spokoju tak długo, jak chcesz. Jeśli zasypiasz, pozwól sobie zasnąć.

[pauza 73]

Dobranoc, {imię}.`;

const present = `{imię}, zatrzymaj się na chwilę.

Nie musisz niczego kończyć, zanim zaczniesz te trzy minuty.

[pauza 4]

Poczuj stopy na podłodze. Poczuj, gdzie ciało dotyka krzesła albo ziemi.

[pauza 11]

Rozejrzyj się powoli. Znajdź wzrokiem trzy rzeczy, które widzisz. Nazwij je w myślach.

[pauza 17]

Teraz posłuchaj. Jakie dwa dźwięki słyszysz? Blisko i daleko.

[pauza 17]

Poczuj jedną rzecz pod palcami. Fakturę. Temperaturę.

[pauza 14]

Weź spokojny oddech. Wydech trochę dłuższy.

[pauza 11]

I jeszcze jeden.

[pauza 14]

Zauważ swoje barki. Jeśli są uniesione, pozwól im opaść. Zauważ szczękę. Jeśli jest zaciśnięta, pozwól jej się rozluźnić.

[pauza 17]

Jesteś tutaj, {imię}. W tym miejscu. W tej chwili. Ta chwila nie potrzebuje ulepszenia.

[pauza 21]

Możesz wrócić do swojego dnia. Wolniej niż przed chwilą.`;

const jacobson = `Cześć, {imię}. To jest relaksacja mięśni według Jacobsona.

Będziemy po kolei lekko napinać i rozluźniać kolejne grupy mięśni. Napięcie ma być delikatne, mniej więcej na trzydzieści procent siły. Nigdy do bólu. Jeśli jakaś część ciała jest obolała albo kontuzjowana, po prostu ją pomiń i tylko wyobraź sobie rozluźnienie.

Połóż się albo usiądź wygodnie, z podparciem pleców i głowy.

[pauza 6]

Weź kilka spokojnych oddechów. Nie spiesz się.

[pauza 16]

Za każdym razem, kiedy usłyszysz słowa „i puść”, rozluźnij mięśnie od razu, całkowicie. A potem po prostu obserwuj, co się dzieje w tym miejscu. Ciepło, ciężar, mrowienie. Albo nic szczególnego. Każde odczucie jest w porządku.

[pauza 11]

Zaczynamy od dłoni. Zaciśnij delikatnie obie dłonie w pięści. Poczuj napięcie w dłoniach i przedramionach.

[pauza 6]

I puść. Pozwól dłoniom się otworzyć. Zauważ różnicę między napięciem a rozluźnieniem.

[pauza 27]

Teraz ramiona. Zegnij ręce w łokciach i delikatnie napnij mięśnie ramion, jakbyś pokazywał biceps.

[pauza 6]

I puść. Ręce opadają swobodnie. Ciężkie i ciepłe.

[pauza 27]

Barki. Unieś barki w stronę uszu. Delikatnie. Poczuj napięcie.

[pauza 5]

I opuść. Pozwól im opaść niżej, niż były na początku.

[pauza 27]

Twarz. Zmarszcz lekko czoło, unosząc brwi.

[pauza 5]

I puść. Czoło wygładza się.

[pauza 20]

Zaciśnij delikatnie powieki.

[pauza 5]

I puść. Oczy odpoczywają.

[pauza 20]

Zaciśnij lekko zęby i poczuj napięcie w szczęce.

[pauza 5]

I puść. Zęby się rozsuwają. Język leży swobodnie. To miejsce, w którym wiele osób nosi napięcie dnia.

[pauza 27]

Kark. Bardzo delikatnie dociśnij tył głowy do podłoża albo oparcia. Tylko odrobinę.

[pauza 5]

I puść. Szyja może odpocząć.

[pauza 27]

Klatka piersiowa i plecy. Ściągnij delikatnie łopatki do siebie.

[pauza 5]

I puść. Plecy rozkładają się szeroko.

[pauza 27]

Brzuch. Napnij lekko mięśnie brzucha, jakbyś przygotowywał się na delikatny dotyk.

[pauza 5]

I puść. Brzuch staje się miękki. Oddech płynie swobodnie.

[pauza 27]

Pośladki. Napnij je delikatnie.

[pauza 5]

I puść. Miednica opada ciężko w stronę podłoża.

[pauza 27]

Uda. Wyprostuj nogi i lekko napnij mięśnie ud.

[pauza 5]

I puść. Nogi stają się ciężkie.

[pauza 27]

Łydki. Delikatnie przyciągnij palce stóp w swoją stronę. Bez skurczu, tylko odrobinę.

[pauza 5]

I puść. Stopy opadają swobodnie.

[pauza 27]

Stopy. Lekko podwiń palce stóp.

[pauza 5]

I puść.

[pauza 27]

Teraz przejdź uwagą przez całe ciało, od stóp do głowy. Jeśli gdzieś zostało trochę napięcia, nie walcz z nim. Po prostu zauważ je i pozwól mu być. Z każdym wydechem może odpuścić samo.

[pauza 41]

Całe ciało jest ciężkie i spokojne, {imię}. Podłoże niesie Cię w całości.

[pauza 81]

Zostań w tym rozluźnieniu. Nic nie musisz.

[pauza 122]

Powoli zacznij wracać. Poruszaj palcami dłoni i stóp.

[pauza 6]

Przeciągnij się, jeśli masz ochotę.

[pauza 6]

Kiedy będziesz gotowy, przekręć się na bok i spokojnie usiądź. Zabierz ze sobą to uczucie ciężkości i spokoju.

[pauza 3]

Dziękuję, {imię}.`;

const estepona = `{imię}, połóż się wygodnie. Jeśli możesz, zamknij oczy.

Ta wizualizacja zabierze Cię w znajome miejsce. Nie musisz niczego dokładnie wyobrażać. Wystarczy, że pozwolisz obrazom przychodzić tak, jak chcą.

[pauza 10]

Weź spokojny oddech. Wydech odrobinę dłuższy.

[pauza 13]

Jest późne przedpołudnie w Esteponie. Leżysz na leżaku. Pod plecami czujesz miękki materiał. Ciało jest ciężkie i rozgrzane.

[pauza 13]

Słońce dotyka Twojej skóry. Najpierw twarzy. Potem ramion. Potem nóg. Ciepło jest przyjemne, nie za mocne. Rozlewa się powoli po całym ciele.

[pauza 19]

Słyszysz morze. Fale przychodzą i odchodzą. Nie musisz ich liczyć. Każda fala przychodzi sama i sama odchodzi.

[pauza 19]

Możesz dopasować oddech do fal, jeśli masz ochotę. Wdech, kiedy fala nadchodzi. Wydech, kiedy cofa się po piasku. A jeśli nie masz ochoty, po prostu słuchaj.

[pauza 25]

Gdzieś niedaleko słychać śmiech dzieci. Może to Leon. Może Gaja. Monika leży obok z książką. Czasem coś powie, czasem jest cicho. Wszystko jest na swoim miejscu.

[pauza 19]

Twój telefon leży głęboko w torbie. Nie musisz po niego sięgać. Nie ma takiej wiadomości, która nie mogłaby poczekać.

[pauza 15]

Poczuj lekki wiatr od morza. Zapach soli. Ciepło piasku pod stopami, kiedy zsuwasz je z leżaka.

[pauza 19]

Nie masz żadnego planu na resztę dnia. Może pójdziesz z Leonem nad wodę. Może zjecie razem coś dobrego. Może po prostu zostaniesz tutaj.

[pauza 25]

Zauważ, {imię}, jak to jest nie potrzebować niczego więcej.

[pauza 13]

Nic nie trzeba poprawić. Nic nie trzeba zbudować. Nic nie trzeba zdobyć.

[pauza 38]

Przypomnij sobie, ile wysiłku kosztowało dojście do tego miejsca. Ile decyzji, ile pracy, ile odwagi. Teraz to wszystko może zostać za Tobą. Jak droga, którą przeszedłeś, żeby dotrzeć na plażę. Nie musisz iść nią z powrotem. Nie musisz też od razu szukać nowej drogi.

[pauza 25]

Zbudowałeś coś, z czego możesz się cieszyć. Enjoy what you've built.

[pauza 25]

To uczucie ma swój adres w Twoim ciele. Może jest w rozluźnionych barkach. Może w ciepłym brzuchu. Może w miękkiej twarzy. Zauważ, gdzie go czujesz.

[pauza 25]

Możesz do niego wracać, kiedy zechcesz, {imię}. Nie tylko w Hiszpanii. Także w zwykły wtorek po pracy. Na kanapie. W ogrodzie. W samochodzie, czekając na dzieci.

[pauza 19]

Nie musisz się do tego zmuszać. Nie musisz sprawdzać, czy już się udało. Możesz po prostu być.

[pauza 76]

Słońce. Morze. Rodzina obok. Spokój, który nie musi być niczym więcej.

[pauza 114]

Powoli zacznij wracać do pokoju, w którym jesteś. Zabierz ze sobą ciepło słońca.

[pauza 6]

Poruszaj palcami. Weź głębszy oddech.

[pauza 6]

Kiedy będziesz gotowy, otwórz oczy.

[pauza 3]

Mam prawo cieszyć się tym, co już zbudowałem.`;

export const AUDIO_SESSIONS: AudioSessionDef[] = [
  {
    id: "demob",
    title: "Głęboka demobilizacja",
    minutes: 15,
    description: "Po długim okresie mobilizacji. Ciało, oddech i leżak w Esteponie.",
    suggestedMotif: "close",
    suggestedBackground: "nature",
    script: demob,
  },
  {
    id: "ideas",
    title: "Nie muszę realizować każdego pomysłu",
    minutes: 8,
    description: "Kiedy ekscytacja ciągnie do kolejnego projektu.",
    suggestedMotif: "none",
    suggestedBackground: "system",
    script: ideas,
  },
  {
    id: "morning",
    title: "Spokojny poranek",
    minutes: 5,
    description: "Kawa, oddech i dzień bez pośpiechu.",
    suggestedMotif: "start",
    suggestedBackground: "jazz",
    script: morning,
  },
  {
    id: "evening",
    title: "Wieczorne odpuszczanie",
    minutes: 10,
    description: "Odkładanie dnia przed snem.",
    suggestedMotif: "close",
    suggestedBackground: "orchestral",
    script: evening,
  },
  {
    id: "present",
    title: "Powrót do chwili obecnej",
    minutes: 3,
    description: "Krótka chwila uziemienia w środku dnia.",
    suggestedMotif: "none",
    suggestedBackground: "none",
    script: present,
  },
  {
    id: "jacobson",
    title: "Relaksacja Jacobsona",
    minutes: 15,
    description: "Łagodne napinanie i rozluźnianie kolejnych mięśni.",
    suggestedMotif: "none",
    suggestedBackground: "nature",
    script: jacobson,
  },
  {
    id: "estepona",
    title: "Leżak w Esteponie",
    minutes: 12,
    description: "Wizualizacja: słońce, morze i nic więcej do zrobienia.",
    suggestedMotif: "none",
    suggestedBackground: "nature",
    script: estepona,
  },
];

export const AUDIO_BY_ID: Record<string, AudioSessionDef> = Object.fromEntries(AUDIO_SESSIONS.map((s) => [s.id, s]));

export function personalize(script: string, forms: NameForms): string {
  return fillName(script, forms);
}
