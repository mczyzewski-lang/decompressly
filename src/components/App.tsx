"use client";

import { useEffect } from "react";
import { useStore, useApp } from "@/lib/store";
import { useRoute } from "@/lib/router";
import { requestPersistentStorage } from "@/lib/db";
import { TabBar } from "./TabBar";
import { ConfirmHost, ToastHost } from "./Hosts";
import FirstRun from "./screens/FirstRun";
import Today from "./screens/Today";
import StartDay from "./screens/StartDay";
import CloseDay from "./screens/CloseDay";
import Breath from "./screens/Breath";
import Yoga from "./screens/Yoga";
import PoseDetail from "./screens/PoseDetail";
import YogaRun from "./screens/YogaRun";
import AudioList from "./screens/AudioList";
import AudioSession from "./screens/AudioSession";
import LetGo from "./screens/LetGo";
import Health from "./screens/Health";
import Ideas from "./screens/Ideas";
import GoalScreen from "./screens/Goal";
import Reflection from "./screens/Reflection";
import History from "./screens/History";
import Rituals from "./screens/Rituals";
import Mantras from "./screens/Mantras";
import Trip from "./screens/Trip";
import Settings from "./screens/Settings";
import SoundStudio from "./screens/SoundStudio";
import ElevenSettings from "./screens/ElevenSettings";
import DataSettings from "./screens/DataSettings";
import Nothing from "./screens/Nothing";
import InstallGuide from "./screens/InstallGuide";
import Thoughts from "./screens/Thoughts";
import Moments from "./screens/Moments";

const FULLSCREEN = new Set(["start", "close", "nothing"]);

function useTheme() {
  const theme = useApp((s) => s.theme);
  useEffect(() => {
    try {
      localStorage.setItem("dc-theme", theme);
    } catch {
      /* private mode */
    }
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.querySelector('meta[name="theme-color"]:not([media])')?.setAttribute("content", dark ? "#161817" : "#FAF8F4");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
}

function useServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        // the first page load happens before the worker controls the page: hand it the chunks already loaded
        const urls = performance
          .getEntriesByType("resource")
          .map((e) => e.name)
          .filter((u) => u.startsWith(location.origin) && u.includes("/_next/static/"));
        reg.active?.postMessage({ type: "warm", urls });
      })
      .catch((e) => console.warn("SW", e));
  }, []);
}

function RouteView() {
  const route = useRoute();
  const [a, b, c] = route.segments;
  switch (a) {
    case "today":
      return <Today />;
    case "start":
      return <StartDay />;
    case "close":
      return <CloseDay />;
    case "breath":
      return <Breath params={route.params} />;
    case "yoga":
      if (b === "pose" && c) return <PoseDetail id={c} />;
      if (b === "run" && c) return <YogaRun id={c} />;
      return <Yoga />;
    case "audio":
      if (b) return <AudioSession id={b} />;
      return <AudioList />;
    case "letgo":
      return <LetGo initialFlow={route.params.get("flow")} />;
    case "health":
      return <Health />;
    case "ideas":
      return <Ideas />;
    case "goal":
      return <GoalScreen />;
    case "reflection":
      return <Reflection />;
    case "history":
      return <History />;
    case "rituals":
      return <Rituals />;
    case "mantras":
      return <Mantras />;
    case "thoughts":
      return <Thoughts />;
    case "moments":
      return <Moments />;
    case "trip":
      return <Trip />;
    case "settings":
      if (b === "sounds") return <SoundStudio />;
      if (b === "eleven") return <ElevenSettings />;
      if (b === "data") return <DataSettings />;
      return <Settings />;
    case "nothing":
      return <Nothing params={route.params} />;
    case "install":
      return <InstallGuide />;
    default:
      return <Today />;
  }
}

export default function App() {
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const onboarded = useApp((s) => s.onboarded);
  const route = useRoute();
  useTheme();
  useServiceWorker();

  useEffect(() => {
    void hydrate();
    void requestPersistentStorage();
  }, [hydrate]);

  if (!hydrated) {
    return <div className="min-h-[100dvh] bg-bg" aria-busy="true" />;
  }
  if (!onboarded) return <FirstRun />;

  const fullscreen = FULLSCREEN.has(route.segments[0]) || (route.segments[0] === "yoga" && route.segments[1] === "run");
  return (
    <>
      <RouteView />
      {!fullscreen && <TabBar />}
      <ConfirmHost />
      <ToastHost />
    </>
  );
}
