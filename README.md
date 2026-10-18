# Decompressly

**Enjoy what you've built.** · *You don't have to build another city today.*

Prywatna aplikacja PWA (iPhone-first) wspierająca świadome kończenie pracy, odkładanie pomysłów bez poczucia straty, spokojny oddech, łagodną jogę regeneracyjną i obecność z rodziną. Jeden użytkownik, dane tylko na urządzeniu, bez streaków, punktów i procentów.

> Decompressly jest narzędziem wspierającym nawyki i dobrostan. Nie jest wyrobem medycznym, niczego nie diagnozuje ani nie leczy.

---

## Co jest w środku

| Moduł | Co działa |
|---|---|
| **Dziś** | Powitanie, mantra dnia, tryby dnia (Praca / Odpoczynek / Wyjazd / Regeneracja), karta celu z aktualnym etapem, START/CLOSE, rytm dnia (odhacz, pomiń, przesuń, edytuj, usuń, dodaj), widok kalendarza bez czerwonych zaległości, propozycje, cotygodniowa opcjonalna refleksja |
| **START day / CLOSE day** | Edytowalne kroki, napój i mantra; 10-sekundowy dźwięk z aktywnego zestawu; animacja zamykającego się koła; status „Po pracy” z możliwością wznowienia; opcjonalna narracja ElevenLabs po CLOSE |
| **Oddech** | 2/5/10 min; tryby 4/6, 3/4, naturalny, własny (2–8 s, bez wstrzymań); koło SVG sterowane `requestAnimationFrame` i zegarem czasu rzeczywistego; pauza/kontynuacja; auto-pauza po przejściu w tło (bez „doganiania” faz); cisza / delikatny sygnał / głos; tryb „Zamknij oczy — prowadzenie głosem” z przyciemnionym ekranem; Wake Lock |
| **Joga** | 12 pozycji z pełnymi opisami (start, kroki, wyjście, błędy, wersja dla początkujących, kiedy pominąć), ilustracje z powiększeniem, sesje 10/20/30 min (dokładnie 600/1200/1800 s) + 4 sesje tematyczne, timer z przejściami i zmianą strony, pauza, pomiń, ±30 s, zakończ, hands-free z głosem |
| **Audio** | 7 kompletnych, oryginalnych scenariuszy (3–15 min) z prawdziwymi pauzami; edytor scenariusza; generacja ElevenLabs akapit po akapicie z montażem (cisza, tło, motyw START/CLOSE, normalizacja, ducking), zapis MP3 offline, eksport; fallback: głos systemowy offline |
| **Odpuść** | „Mam nowy pomysł” (z komunikatem listopadowym), „Czuję napięcie” (5 kroków), „Chcę odpocząć” |
| **Parking pomysłów** | Jedno zdanie = jeden pomysł; parkuj / wybierz świadomie / odpuść / usuń |
| **Keep Your Nervous System Healthy** | Sleep, Movement, Breath, Downshift, Mindset, Connection, Stimulation — opis, wskazówki, konkretna akcja z linkiem |
| **Cel osobisty** | 18.10–31.12.2026, trzy etapy (wszystko edytowalne), bez procentów; historia refleksji |
| **Mantry** | 64 mantry w 8 kategoriach (wszystkie obowiązkowe), ulubione, przypinanie, mantra na dziś, nagrania ElevenLabs, własne mantry |
| **Biblioteka myśli** | 130 osobistych myśli (parafrazy z rozmów) w 12 kategoriach + 18 pytań do refleksji; ulubione, edycja każdego zdania, „To nie moje / nie pokazuj ponownie” z możliwością przywrócenia, własne myśli, opcjonalne notatki do pytań. W aplikacji pojawia się najwyżej jedna myśl naraz, w pasującym kontekście (Dziś, po CLOSE, „Mam nowy pomysł” — w listopadzie z naciskiem na demobilizację, „Czuję napięcie”); myśli o przemijaniu dzieciństwa nigdy nie pojawiają się w momentach decyzji. Cotygodniowa refleksja proponuje jedno dodatkowe pytanie z biblioteki |
| **Tryb wyjazdu** | 5-dniowy plan; ekran Dziś pokazuje tylko mantrę, jedno ćwiczenie i opcjonalne audio |
| **Ustawienia** | Imię, motyw jasny/ciemny, rytuały i godziny, zestawy dźwięków, głos i model ElevenLabs, biblioteka audio, domyślny oddech, ulubiona sesja jogi, parking, refleksje, import/eksport, prywatność |

## Szybki start (lokalnie)

```bash
npm install
cp .env.example .env.local     # uzupełnij ELEVENLABS_API_KEY (opcjonalnie)
npm run dev                    # http://localhost:3000
```

Bez klucza ElevenLabs aplikacja działa w pełni: wbudowane dźwięki START/CLOSE, tła i ilustracje są częścią projektu, a sesje audio używają głosu systemowego.

## Konfiguracja ElevenLabs

1. Utwórz klucz API w panelu ElevenLabs (Profile → API Keys). Wystarczą uprawnienia do *Text to Speech*, *Sound Effects* i *Voices (read)*.
2. Ustaw zmienne **wyłącznie na serwerze**:

   | Zmienna | Opis |
   |---|---|
   | `ELEVENLABS_API_KEY` | klucz ElevenLabs (nigdy z prefiksem `NEXT_PUBLIC_`) |
   | `APP_ACCESS_KEY` | długi losowy kod chroniący płatne endpointy, np. `openssl rand -hex 24` |
   | `ELEVENLABS_DAILY_CHAR_LIMIT` | opcjonalny dzienny limit znaków TTS na instancję (ochrona kosztów) |

3. W aplikacji: **Ustawienia → ElevenLabs** → wpisz kod dostępu → „Pokaż głosy” → wybierz głos (lub wklej ID). Zalecany model dla polskiego: `eleven_multilingual_v2`.
4. Opcjonalnie: „Wskazówki głosowe” (wdech/wydech + 12 instrukcji jogi) — jedna partia, offline na zawsze.

### Użyte endpointy (zweryfikowane z dokumentacją)

- `POST /v1/sound-generation` — `text`, `duration_seconds: 10` (zakres 0.5–30), `prompt_influence` (0–1, domyślnie 0.3; w aplikacji 0.5, regulowane), `model_id: "eleven_text_to_sound_v2"`, `loop`. Proxy: `src/app/api/eleven/sound/route.ts`.
- `POST /v1/text-to-speech/{voice_id}?output_format=mp3_44100_128&enable_logging=false` — `text`, `model_id`, `voice_settings` (`stability`, `similarity_boost`, `style`, `use_speaker_boost`, `speed`), `previous_text`/`next_text` dla płynnej intonacji między akapitami, `language_code: "pl"` tylko dla modeli, które go obsługują. Proxy: `src/app/api/eleven/tts/route.ts`.
- `GET /v1/voices` — lista głosów. Proxy: `src/app/api/eleven/voices/route.ts`.

### Zasady kosztów i bezpieczeństwa

- **Żadna płatna generacja nie odbywa się bez okna potwierdzenia** z liczbą fragmentów i znaków. Serwer dodatkowo odrzuca żądania bez nagłówka `x-confirm-paid`.
- **Nic zaakceptowanego nie jest generowane ponownie.** Akapity narracji są cache'owane po treści + głosie + modelu; zmiana jednego akapitu generuje tylko ten akapit. Zmiana tła lub motywu to darmowy ponowny montaż. Zapisane zestawy START/CLOSE nigdy nie są regenerowane.
- Znaczniki `[pauza N]` **nigdy nie trafiają do TTS** — stają się prawdziwą ciszą w montażu (walidowane po stronie klienta i serwera).
- Klucz API istnieje tylko w zmiennych środowiskowych serwera. W produkcji endpointy `/api/eleven/*` wymagają `APP_ACCESS_KEY` (porównanie odporne na timing), mają limit żądań i opcjonalny dzienny limit znaków. Bez `APP_ACCESS_KEY` w produkcji są wyłączone.
- Service worker nigdy nie cache'uje `/api/*`.

### Para START/CLOSE — workflow

Dwie osobne generacje nie gwarantują identycznego motywu, dlatego **Ustawienia → Motywy dźwiękowe** oferuje:

1. wybór stylu (Natura / System / Jazz / Orkiestra / Własny) z dopracowanymi promptami START i CLOSE (`src/lib/sounds.ts`), edytowalnymi;
2. generację START, odsłuch, regenerację — każda wersja zostaje na liście do porównania;
3. **wariant z jednego motywu bazowego** — CLOSE tworzony lokalnie z zaakceptowanego START (niżej o 2 półtony, ciemniej, dłuższy pogłos, wybrzmienie) lub odwrotnie; ten sam materiał muzyczny, zero kosztów;
4. import własnych plików MP3/WAV/M4A;
5. odsłuch pary START → CLOSE, zapis jako zestaw, ustawienie jako aktywny; wiele zapisanych zestawów.

Cztery **wbudowane zestawy** (i cztery tła do relaksacji) są syntezowane proceduralnie przez `scripts/generate-sounds.mjs` — wspólny trzydźwiękowy motyw w każdej parze, brak praw osób trzecich. Regeneracja: `npm run generate:sounds` (wymaga ffmpeg).

## Wdrożenie (Vercel)

1. Wypchnij repozytorium i zaimportuj projekt w Vercel (framework: Next.js, bez zmian w ustawieniach build).
2. Dodaj zmienne `ELEVENLABS_API_KEY`, `APP_ACCESS_KEY` (i opcjonalnie `ELEVENLABS_DAILY_CHAR_LIMIT`) w *Project → Settings → Environment Variables*.
3. Deploy. Aplikacja działa pod adresem `*.vercel.app`.
4. **Domena decompressly.com** — gdy będzie kupiona: *Project → Settings → Domains → Add* i ustaw rekordy DNS wskazane przez Vercel. Kod nie zakłada żadnej konkretnej domeny.

Dowolny inny hosting Node.js też zadziała: `npm run build && npm start`.

Strona ma `noindex`, nagłówki bezpieczeństwa i nie zbiera żadnej analityki. Dane prywatne (rytuały, pomysły, refleksje, historia, nagrania) nie istnieją na serwerze — są tylko w IndexedDB urządzenia, więc publiczny adres nie ujawnia niczego poza samą aplikacją.

## Instalacja na iPhonie

1. Otwórz adres aplikacji w **Safari**.
2. Stuknij **Udostępnij** (kwadrat ze strzałką).
3. Wybierz **Dodaj do ekranu początkowego** → **Dodaj**.
4. Uruchom z ikony. Pierwsze dotknięcie przycisku z dźwiękiem odblokowuje audio (wymóg iOS).

Instrukcja jest też w aplikacji: Ustawienia → Instalacja na iPhonie.

### Zachowanie na iOS

- Safe areas (`viewport-fit=cover`, `env(safe-area-inset-*)`), tryb standalone, ikony i manifest.
- Autoplay: każde audio startuje z gestu; współdzielony `AudioContext` jest odblokowywany przy pierwszym dotknięciu. Od iOS 17 `navigator.audioSession.type = "playback"` pozwala krótkim sygnałom grać mimo przełącznika wyciszenia.
- Sesje audio zapisane jako MP3 grają przez `<audio>` z Media Session (sterowanie z ekranu blokady). Service worker obsługuje żądania `Range`, więc pliki offline są odtwarzane poprawnie.
- Oddech i joga trzymają ekran włączony (Wake Lock, iOS 16.4+), a po przejściu w tło **pauzują się** — czas nie jest „nadrabiany” po powrocie.
- `prefers-reduced-motion`: koło oddechu przestaje się skalować (zostaje subtelna zmiana jasności), animacje rytuałów są natychmiastowe.
- VoiceOver: etykiety przycisków, `aria-live` dla faz i timerów, role `radiogroup`/`switch`, opisy ilustracji.

## Dane i pamięć

- Stan aplikacji: IndexedDB (`kv`), zapis z debounce i przy przejściu w tło.
- Duże pliki audio: IndexedDB (`blobs`) jako kopie oparte na `ArrayBuffer` (obejście problemów Safari z Blobami ze streamów). Aplikacja prosi o `navigator.storage.persist()`.
- Safari może usuwać dane stron nieużywanych przez kilka tygodni — **w trybie zainstalowanym (ekran główny) dane są trwałe**. Rozmiary orientacyjne: narracja 15 min ≈ 7 MB (MP3 64 kb/s mono), efekt 10 s ≈ 160 kB.
- **Eksport/Import**: Ustawienia → Import i eksport danych — plik JSON, opcjonalnie z wszystkimi nagraniami. Pojedyncze sesje można eksportować jako MP3.

## Offline

Jedna prerenderowana strona + hash-router (`#/breath`, `#/yoga` itd.) to świadoma decyzja: offline na iOS jest wtedy prosty i niezawodny. Service worker (`public/sw.js`): network-first dla dokumentu z fallbackiem do cache, cache-first dla `/_next/static`, dźwięków i ikon (precache przy instalacji), nigdy nie cache'uje `/api`. Bez sieci działa wszystko poza nowymi generacjami ElevenLabs.

## Zdjęcia jogi — stan i workflow

**Ograniczenie (jawnie):** środowisko, w którym zbudowano aplikację, nie miało dostępu do Wikimedia Commons, więc nie było możliwe pobranie ani zweryfikowanie licencji konkretnych zdjęć. Zgodnie ze specyfikacją aplikacja używa **własnych ilustracji SVG** każdej pozycji (`src/lib/yoga/figures.ts`, renderer `render-svg.ts`) — z rekwizytami (poduszka, wałek, pasek, krzesło), opisem alternatywnym i powiększeniem, w jasnym i ciemnym motywie.

Gotowy jest pełny workflow legalnych zdjęć z ręczną akceptacją:

```bash
npm run fetch:yoga-photos                       # pobiera kandydatów z Commons, tylko CC0 / PD / CC BY / CC BY-SA
open yoga-photo-review/index.html               # przejrzyj: czy to dokładnie ta pozycja i czy licencja się zgadza
npm run fetch:yoga-photos -- approve child 2    # konwersja do WebP, autor/licencja/źródło → src/data/yoga-photos.json
npm run fetch:yoga-photos -- revoke child       # powrót do ilustracji
```

Zdjęcie pojawia się w aplikacji tylko po `approve` (z widocznym przypisaniem autorstwa), więc fotografia, która jedynie przypomina asanę, nie trafi do aplikacji automatycznie.

## Treści — źródła i zasady

- Instrukcje jogi oparte na powszechnie przyjętych wskazaniach jogi regeneracyjnej i zasadach bezpieczeństwa (komfortowy zakres, podparcie, brak pozycji odwróconych, świecy, agresywnych skrętów i obciążania odcinka szyjnego), z modyfikacjami dla początkujących i przeciwwskazaniami. Warto, by fizjoterapeuta przejrzał je pod Twoje ciało.
- „Keep Your Nervous System Healthy” bazuje na konserwatywnych, mainstreamowych zaleceniach (np. WHO dot. aktywności fizycznej, higiena snu, badania nad psychologicznym odłączeniem od pracy). HRV nie jest przedstawiane jako miernik regeneracji psychicznej; brak obietnic hormonalnych; brak sugestii leczenia zaburzeń lękowych.
- Oddech: brak hiperwentylacji i wstrzymywania oddechu, komunikat bezpieczeństwa, zakończenie bez komunikatu o porażce, brak pomiaru stresu.

## Testy

```bash
npm run lint        # tsc --noEmit
npm test            # vitest — logika (sesje jogi = dokładnie 10/20/30 min, silnik oddechu, pauzy, scenariusze, mantry, etapy celu)
npm run build
npm run test:e2e    # Playwright (mobilny viewport) na buildzie produkcyjnym
```

E2E obejmuje: pierwsze uruchomienie, START/CLOSE i wznowienie pracy, rytm dnia (odhacz/przesuń/usuń, kalendarz), sesję oddechu (animacja w czasie rzeczywistym, pauza zamraża fazę), sesję jogi (±30 s, pomiń, zakończ), parking pomysłów z trwałością po przeładowaniu, mantry, tryb wyjazdu, eksport danych, **działanie offline**, a także pełny pipeline narracji i generatora dźwięków na **zamockowanym** API (żadne płatne wywołanie nie jest wykonywane — każde nieoczekiwane wywołanie `/api/eleven` przerywa test).

W środowisku z własnym Chromium: `CHROMIUM_PATH=/ścieżka/do/chrome npm run test:e2e`.

## Architektura

```
src/app/                Next.js App Router: layout, jedna strona, API (status, eleven/sound|tts|voices)
src/components/         App (router + host dialogów), TabBar, ui.tsx (design system), screens/*, today/*
src/lib/                store (zustand+immer → IndexedDB), db, router, breath, goal, mantras, health, sounds, defaults
src/lib/audio/          engine (iOS audio, mowa, sygnały), segments (parser scenariuszy), scripts (7 sesji),
                        narration (generacja + cache), render (montaż OfflineAudioContext, MP3 lamejs, warianty)
src/lib/yoga/           poses, sessions, figures, render-svg
src/lib/server/         eleven.ts — klucz, ochrona dostępu, limity (server-only)
public/                 sw.js, manifest, ikony, sounds/ (wbudowane, syntezowane)
scripts/                generate-sounds, generate-icons, fetch-yoga-photos
```

Stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, komponenty w stylu shadcn/ui na Radix (Dialog), Lucide, zustand + immer, idb, lamejs. Typografia: systemowy SF Pro + New York (`ui-serif`) na urządzeniach Apple — bez pobierania fontów.

## Znane ograniczenia

- Zdjęcia jogi: patrz wyżej — ilustracje SVG do czasu uruchomienia workflow zdjęć.
- ElevenLabs nie było wywoływane podczas budowy (brak klucza i dostępu sieciowego); integracja jest zgodna z dokumentacją i przetestowana na zamockowanym API. Przy pierwszym użyciu wygeneruj próbkę głosu (Ustawienia → ElevenLabs).
- Głos systemowy (fallback) na iOS zatrzymuje się po zablokowaniu ekranu — do słuchania z zablokowanym ekranem wygeneruj narrację ElevenLabs (zapisuje się jako plik).
- Limit znaków i limit żądań na serwerze są per instancja (wystarczające dla jednej osoby; nie jest to globalny licznik).
