import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// The ElevenLabs proxy is mocked with a bundled sound, so the whole pipeline
// (confirmation → per-paragraph TTS → montage with silences → MP3 → offline playback) is exercised for free.
const fakeAudio = readFileSync("public/sounds/nature-start.mp3");

test("narration pipeline: confirm, generate paragraphs, montage, save offline", async ({ page }) => {
  test.setTimeout(240_000);
  const ttsBodies: { text: string }[] = [];
  await page.route("**/api/eleven/tts", async (route) => {
    const body = route.request().postDataJSON();
    expect(route.request().headers()["x-confirm-paid"]).toBe("1");
    ttsBodies.push(body);
    await route.fulfill({ status: 200, contentType: "audio/mpeg", body: fakeAudio });
  });
  await page.route("**/api/eleven/sound", (route) => route.fulfill({ status: 200, contentType: "audio/mpeg", body: fakeAudio }));

  await page.goto("/");
  await page.getByRole("button", { name: "Zacznij spokojnie" }).click();
  await page.evaluate(() => (location.hash = "#/settings/eleven"));
  await page.getByLabel("lub ID głosu").fill("TestVoice1234567890");

  await page.evaluate(() => (location.hash = "#/audio/present"));
  await page.getByRole("button", { name: "Wygeneruj narrację" }).click();
  await expect(page.getByText("Plik zapisany na urządzeniu")).toBeVisible({ timeout: 45_000 });

  expect(ttsBodies.length).toBeGreaterThan(5);
  for (const b of ttsBodies) expect(b.text).not.toMatch(/\[pauza|\[motyw|\{name\}|\{imię/);
  expect(ttsBodies.some((b) => b.text.includes("Marku"))).toBe(true); // addressed by name, in the vocative
  await expect(page.getByRole("button", { name: /Eksportuj MP3/ })).toBeVisible();

  // longer pauses / another background are a free automatic re-montage, no new TTS calls
  const before = ttsBodies.length;
  const durBefore = await page.getByText(/^\d+:\d\d$/).last().textContent();
  await page.getByRole("radio", { name: "10 s" }).click();
  await expect(page.getByText("Plik zapisany na urządzeniu")).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText(/^\d+:\d\d$/).last()).not.toHaveText(durBefore ?? "", { timeout: 45_000 });
  expect(ttsBodies.length).toBe(before);

  // a longer session adds the deeper passages; paragraphs recorded before are reused
  await page.getByRole("radio", { name: "15 min" }).click();
  await page.getByRole("button", { name: "Wygeneruj narrację" }).first().click();
  await expect.poll(() => ttsBodies.length, { timeout: 30_000 }).toBeGreaterThan(before);
  await expect(page.getByText(/^Zapisana narracja: /)).toBeVisible({ timeout: 90_000 });
  const texts = ttsBodies.map((b) => b.text);
  expect(new Set(texts).size).toBe(texts.length); // nothing recorded twice
  expect(texts.some((t) => t.includes("schody"))).toBe(true); // the staircase descent of longer sessions
});

test("sound studio: generate START, derive CLOSE locally, save and activate", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/eleven/sound", (route) => {
    calls++;
    return route.fulfill({ status: 200, contentType: "audio/mpeg", body: fakeAudio });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Zacznij spokojnie" }).click();
  await page.evaluate(() => (location.hash = "#/settings/sounds"));
  await page.getByRole("button", { name: "Generuj START" }).click();
  await expect(page.getByRole("button", { name: /Wersja 1/ }).first()).toBeVisible();
  await page.getByRole("button", { name: /Utwórz wariant z jednego motywu/ }).click();
  await page.getByRole("button", { name: /CLOSE z wybranego START: Spokojniejszy/ }).click();
  await expect(page.getByText(/Wariant: Wariant/)).toBeVisible({ timeout: 20_000 });
  await page.getByLabel("Nazwa zestawu").fill("Mój system");
  await page.getByRole("button", { name: "Zapisz i ustaw" }).click();
  await expect(page.getByText("Mój system")).toBeVisible();
  await expect(page.getByText("Aktywny ·").first()).toBeVisible();
  expect(calls).toBe(1);
});

test("Moje myśli: record a thought with a calm voice after confirmation, then reuse it", async ({ page }) => {
  const texts: string[] = [];
  await page.route("**/api/eleven/tts", async (route) => {
    texts.push(route.request().postDataJSON().text);
    await route.fulfill({ status: 200, contentType: "audio/mpeg", body: fakeAudio });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Zacznij spokojnie" }).click();
  await page.evaluate(() => (location.hash = "#/settings/eleven"));
  await page.getByLabel("lub ID głosu").fill("TestVoice1234567890");
  await page.evaluate(() => (location.hash = "#/thoughts"));
  await page.getByRole("button", { name: /Moja energia jest moją walutą/ }).click();
  await page.getByRole("button", { name: "Nagraj spokojnym głosem" }).click();
  await expect(page.getByRole("button", { name: "Nagrana głosem ElevenLabs" })).toBeVisible();
  expect(texts).toEqual(["Moja energia jest moją walutą."]);
  await page.getByRole("button", { name: "Posłuchaj", exact: true }).click(); // plays the saved file, no new call
  await page.waitForTimeout(300);
  expect(texts.length).toBe(1);
});

test("breath voice guidance uses only the ElevenLabs voice, recorded once", async ({ page }) => {
  await page.addInitScript(() => {
    // any use of the system voice fails the test
    Object.defineProperty(window, "speechSynthesis", { get: () => { throw new Error("system voice used"); } });
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const texts: string[] = [];
  await page.route("**/api/eleven/tts", async (route) => {
    texts.push(route.request().postDataJSON().text);
    await route.fulfill({ status: 200, contentType: "audio/mpeg", body: fakeAudio });
  });
  const sounds: { text: string; duration_seconds: number }[] = [];
  await page.route("**/api/eleven/sound", async (route) => {
    sounds.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "audio/mpeg", body: fakeAudio });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Zacznij spokojnie" }).click();
  await page.evaluate(() => (location.hash = "#/settings/eleven"));
  await page.getByLabel("lub ID głosu").fill("TestVoice1234567890");
  await page.evaluate(() => (location.hash = "#/breath"));
  await page.getByRole("radio", { name: "Głos" }).click();
  await page.getByRole("button", { name: "Zacznij", exact: true }).click();
  await expect(page.getByText("Wdech", { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500);
  expect(texts).toEqual(expect.arrayContaining(["Spokojnie wciągnij powietrze.", "I powoli je wypuść.", "Możesz wrócić do swojego dnia, Marku."]));
  expect(texts.some((t) => /^(Wdech|Wydech)\.$/.test(t))).toBe(false); // lone words were read in English
  // real breath sounds: one recording per phase, exactly as long as the phase (calm rhythm: 4 s / 6 s)
  expect(sounds.map((x) => x.duration_seconds).sort()).toEqual([4, 6]);
  expect(sounds.every((x) => /inhale|exhale/.test(x.text))).toBe(true);
  expect(new Set(texts).size).toBe(texts.length); // each phrase generated once
  expect(errors.filter((e) => e.includes("system voice"))).toEqual([]);
});

test("sound studio: one tap generates START + CLOSE for all four styles", async ({ page }) => {
  const prompts: string[] = [];
  await page.route("**/api/eleven/sound", async (route) => {
    const b = route.request().postDataJSON();
    prompts.push(b.text);
    expect(b.duration_seconds).toBe(20);
    await route.fulfill({ status: 200, contentType: "audio/mpeg", body: fakeAudio });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Zacznij spokojnie" }).click();
  await page.evaluate(() => (location.hash = "#/settings/sounds"));
  await page.getByRole("button", { name: /Wygeneruj 4 zestawy/ }).click();
  await expect(page.getByText(/Orkiestra · ElevenLabs/)).toBeVisible({ timeout: 30_000 });
  expect(prompts.length).toBe(8);
  expect(prompts.filter((p) => /energizing/i.test(p)).length).toBe(4);
  for (const label of ["Natura", "System", "Jazz", "Orkiestra"]) await expect(page.getByText(new RegExp(`^${label} · ElevenLabs`)).first()).toBeVisible();

  // generating again only adds — the first four sets stay, with their audio
  await page.getByRole("button", { name: /Wygeneruj 4 zestawy/ }).click();
  await expect.poll(() => prompts.length, { timeout: 30_000 }).toBe(16);
  const sets = page.locator("p", { hasText: /^(Natura|System|Jazz|Orkiestra) · ElevenLabs/ });
  await expect(sets).toHaveCount(8, { timeout: 10_000 });
  await expect(page.getByText(/poprzednie zostały/)).toBeVisible({ timeout: 10_000 });
  await page.reload();
  await page.evaluate(() => (location.hash = "#/settings/sounds"));
  await expect(sets).toHaveCount(8);
  const blobs = await page.evaluate(async () => {
    const req = indexedDB.open("decompressly");
    const db: IDBDatabase = await new Promise((r) => (req.onsuccess = () => r(req.result)));
    return new Promise<number>((r) => {
      const c = db.transaction("blobs").objectStore("blobs").count();
      c.onsuccess = () => r(c.result);
    });
  });
  expect(blobs).toBeGreaterThanOrEqual(16);
});

test("path: the next session retells the reflection in its own words (never word for word)", async ({ page }) => {
  test.setTimeout(150_000);
  const tts: string[] = [];
  const asked: { text: string; question: string }[] = [];
  await page.route("**/api/eleven/tts", async (route) => {
    tts.push(route.request().postDataJSON().text);
    await route.fulfill({ status: 200, contentType: "audio/mpeg", body: fakeAudio });
  });
  await page.route("**/api/status", async (route) => {
    const res = await route.fetch();
    await route.fulfill({ response: res, json: { ...(await res.json()), paraphraseConfigured: true } });
  });
  await page.route("**/api/paraphrase", async (route) => {
    asked.push(route.request().postDataJSON());
    await route.fulfill({ json: { paraphrase: "Wciąż wracasz myślami do spraw, które jeszcze nie zostały domknięte." } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Zacznij spokojnie" }).click();
  await page.evaluate(() => (location.hash = "#/settings/eleven"));
  await page.getByLabel("lub ID głosu").fill("TestVoice1234567890");

  await page.evaluate(() => (location.hash = "#/audio"));
  await page.getByRole("button", { name: /Ścieżka oczyszczenia/ }).click();
  await expect(page.getByText("Otworzy się po refleksji z etapu 1")).toBeVisible();
  await page.getByRole("button", { name: "Zacznij drogę" }).click();

  await expect(page.getByText("Co noszę w sobie najciężej?")).toBeVisible();
  await page.getByLabel("Twoja refleksja").fill("Ciągle wracam do niedokończonych spraw.");
  await page.getByRole("button", { name: "Zapisz refleksję" }).click();
  await expect(page.getByText(/Etap 2 „Przyjrzeć się z życzliwością” nawiąże do tego własnymi słowami/)).toBeVisible();
  await expect.poll(() => asked.length).toBe(1);
  expect(asked[0]).toMatchObject({ text: "Ciągle wracam do niedokończonych spraw.", question: expect.stringContaining("najciężej") });
  await page.getByRole("button", { name: /Etap 2: Przyjrzeć się/ }).click();

  await expect(page.getByText("Sesja powie")).toBeVisible();
  await expect(page.getByText("Wciąż wracasz myślami do spraw, które jeszcze nie zostały domknięte.").first()).toBeVisible();
  await page.getByRole("button", { name: "Wygeneruj narrację" }).click();
  await expect(page.getByText("Plik zapisany na urządzeniu")).toBeVisible({ timeout: 120_000 });
  expect(tts.some((t) => t.includes("Wciąż wracasz myślami do spraw, które jeszcze nie zostały domknięte."))).toBe(true);
  expect(tts.join(" ")).not.toContain("niedokończonych"); // the reflection is never read back word for word
  for (const t of tts) expect(t).not.toMatch(/\{echo\}|\{myśl\}|\[pauza/);

  // your own wording replaces the paraphrase; only that paragraph is recorded again
  const before = tts.length;
  await page.getByRole("button", { name: "Ujmij to po swojemu" }).click();
  await page.getByLabel("Jak sesja ma to ująć").fill("Masz w sobie kilka spraw, które czekają na domknięcie.");
  await page.getByRole("button", { name: "Zapisz", exact: true }).click();
  await page.getByRole("button", { name: "Wygeneruj narrację" }).first().click();
  await expect.poll(() => tts.length, { timeout: 30_000 }).toBe(before + 1);
  await expect(page.getByText(/^Zapisana narracja: /)).toBeVisible({ timeout: 120_000 });
  expect(tts.slice(before).join(" ")).toContain("Masz w sobie kilka spraw");

  // keeping it private: the session refers to the path without it
  await page.getByRole("button", { name: "Nie nawiązuj — zachowaj dla siebie" }).click();
  await expect(page.getByText("Ta sesja nawiąże do drogi bez cytowania", { exact: false })).toBeVisible();
});

test("voice collection: pasted ID with invisible characters, own model per voice used for speech", async ({ page }) => {
  const bodies: { voice_id: string; model_id: string }[] = [];
  await page.route("**/api/eleven/tts", async (route) => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "audio/mpeg", body: fakeAudio });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Zacznij spokojnie" }).click();
  await page.evaluate(() => (location.hash = "#/settings/eleven"));
  await page.getByLabel("Dodaj ID głosów do kolekcji").fill("​Abcd1234Efgh5678Ijkl​ ");
  await page.getByRole("button", { name: "Dodaj", exact: true }).click();
  await expect(page.getByText("Dodano głos do kolekcji.")).toBeVisible();
  await page.getByLabel("Model głosu Głos 1").selectOption("eleven_v3");
  await page.getByRole("button", { name: "Wygeneruj próbkę głosu" }).click();
  await expect.poll(() => bodies.length).toBe(1);
  expect(bodies[0]).toMatchObject({ voice_id: "Abcd1234Efgh5678Ijkl", model_id: "eleven_v3" });

  // every text field is at least 16px, so iOS never zooms in on focus
  const small = await page.locator("input:not([type=range]):not([type=checkbox]):not([type=file]), textarea, select").evaluateAll((els) =>
    els.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16).map((el) => el.getAttribute("aria-label") || el.outerHTML.slice(0, 80)),
  );
  expect(small).toEqual([]);
});

test("rate limit mid-generation: waits, resumes and finishes without an error", async ({ page }) => {
  test.setTimeout(180_000);
  let calls = 0;
  let limited = 0;
  await page.route("**/api/eleven/tts", async (route) => {
    calls++;
    if (calls % 7 === 0 && limited < 3) {
      limited++;
      await route.fulfill({ status: 429, contentType: "application/json", headers: { "Retry-After": "1" }, body: JSON.stringify({ error: "Zbyt wiele żądań naraz." }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "audio/mpeg", body: fakeAudio });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Zacznij spokojnie" }).click();
  await page.evaluate(() => (location.hash = "#/settings/eleven"));
  await page.getByLabel("lub ID głosu").fill("TestVoice1234567890");
  await page.evaluate(() => (location.hash = "#/audio/present"));
  await page.getByRole("button", { name: "Wygeneruj narrację" }).click();
  await expect(page.getByText(/Chwila przerwy dla ElevenLabs/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Plik zapisany na urządzeniu")).toBeVisible({ timeout: 150_000 });
  expect(limited).toBe(3);
  await expect(page.getByText(/Zbyt wiele żądań/)).toHaveCount(0);
});
