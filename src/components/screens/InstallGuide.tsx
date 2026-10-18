"use client";

import { Share, SquarePlus, Smartphone, Volume2 } from "lucide-react";
import { Card, Screen, ScreenHeader } from "../ui";

const STEPS = [
  { Icon: Smartphone, title: "Otwórz w Safari", body: "Wejdź na adres Decompressly w Safari na iPhonie (nie w Chrome ani w przeglądarce wbudowanej w inną aplikację)." },
  { Icon: Share, title: "Stuknij „Udostępnij”", body: "Ikona kwadratu ze strzałką na dolnym pasku Safari." },
  { Icon: SquarePlus, title: "„Dodaj do ekranu początkowego”", body: "Przewiń listę w dół, wybierz tę opcję i potwierdź „Dodaj”. Na ekranie pojawi się ikona Decompressly." },
  { Icon: Volume2, title: "Pierwsze uruchomienie", body: "Otwórz aplikację z ikony. Dotknij dowolnego przycisku z dźwiękiem — iOS wymaga gestu, zanim pozwoli odtwarzać audio. Wbudowane dźwięki i ilustracje zapiszą się do pracy offline." },
];

export default function InstallGuide() {
  const standalone = typeof window !== "undefined" && (matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone);
  return (
    <Screen tabbed>
      <ScreenHeader title="Instalacja na iPhonie" subtitle={standalone ? "Decompressly działa już jako aplikacja." : "Cztery kroki, raz na zawsze."} fallback="settings" />
      <ol className="mt-4 space-y-3">
        {STEPS.map((s, i) => (
          <li key={i}>
            <Card className="flex gap-4">
              <s.Icon className="mt-0.5 h-6 w-6 shrink-0 text-sage-deep" strokeWidth={1.6} />
              <div>
                <p className="text-[16px] text-ink">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{s.body}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>
      <div className="mt-6 space-y-2 px-1 text-[13px] leading-relaxed text-ink-3">
        <p>Przełącznik wyciszenia: od iOS 17 krótkie sygnały oddechu grają także przy wyciszonym telefonie; starsze wersje mogą je wyciszać.</p>
        <p>Sesje audio zapisane jako plik grają przy zablokowanym ekranie. Oddech i joga utrzymują ekran włączony podczas ćwiczenia, a po przejściu aplikacji w tło zatrzymują się bez przyspieszania.</p>
        <p>Dane są w pamięci aplikacji na tym iPhonie. Kopię zrobisz w Ustawienia → Import i eksport danych.</p>
      </div>
    </Screen>
  );
}
