import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// The ElevenLabs proxy is mocked with a bundled sound, so the whole pipeline
// (confirmation → per-paragraph TTS → montage with silences → MP3 → offline playback) is exercised for free.
const fakeAudio = readFileSync("public/sounds/nature-start.mp3");

test("narration pipeline: confirm, generate paragraphs, montage, save offline", async ({ page }) => {
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
  for (const b of ttsBodies) expect(b.text).not.toMatch(/\[pauza|\{name\}/);
  expect(ttsBodies.some((b) => b.text.includes("Marek"))).toBe(true);
  await expect(page.getByRole("button", { name: /Eksportuj MP3/ })).toBeVisible();

  // longer pauses / another background are a free automatic re-montage, no new TTS calls
  const before = ttsBodies.length;
  const durBefore = await page.getByText(/^\d+:\d\d$/).last().textContent();
  await page.getByRole("radio", { name: "×3" }).click();
  await page.getByRole("radio", { name: "10 s" }).click();
  await expect(page.getByText("Plik zapisany na urządzeniu")).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText(/^\d+:\d\d$/).last()).not.toHaveText(durBefore ?? "", { timeout: 45_000 });
  expect(ttsBodies.length).toBe(before);
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
  await page.goto("/");
  await page.getByRole("button", { name: "Zacznij spokojnie" }).click();
  await page.evaluate(() => (location.hash = "#/settings/eleven"));
  await page.getByLabel("lub ID głosu").fill("TestVoice1234567890");
  await page.evaluate(() => (location.hash = "#/breath"));
  await page.getByRole("radio", { name: "Głos" }).click();
  await page.getByRole("button", { name: "Zacznij", exact: true }).click();
  await expect(page.getByText("Wdech", { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500);
  expect(texts).toEqual(expect.arrayContaining(["Wdech.", "Wydech.", "Możesz wrócić do swojego dnia."]));
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
  for (const label of ["Natura", "System", "Jazz", "Orkiestra"]) await expect(page.getByText(new RegExp(`^${label} · ElevenLabs`))).toBeVisible();
});
