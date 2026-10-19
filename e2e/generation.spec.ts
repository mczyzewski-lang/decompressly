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
  await expect(page.getByRole("heading", { name: "Płatna generacja ElevenLabs" })).toBeVisible();
  await page.getByRole("button", { name: "Generuj" }).click();
  await expect(page.getByText("Plik zapisany na urządzeniu")).toBeVisible({ timeout: 45_000 });

  expect(ttsBodies.length).toBeGreaterThan(5);
  for (const b of ttsBodies) expect(b.text).not.toMatch(/\[pauza|\{name\}/);
  expect(ttsBodies.some((b) => b.text.includes("Marek"))).toBe(true);
  await expect(page.getByRole("button", { name: /Eksportuj MP3/ })).toBeVisible();

  // regenerating after a background change is a free re-montage, no new TTS calls
  const before = ttsBodies.length;
  await page.getByRole("radio", { name: "Natura" }).click();
  await page.getByRole("button", { name: "Zmontuj ponownie" }).click();
  await expect(page.getByText("Plik zapisany na urządzeniu")).toBeVisible({ timeout: 45_000 });
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
  await page.getByRole("button", { name: "Generuj", exact: true }).click();
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
  await page.getByRole("button", { name: "Generuj" }).click();
  await expect(page.getByRole("button", { name: "Nagrana głosem ElevenLabs" })).toBeVisible();
  expect(texts).toEqual(["Moja energia jest moją walutą."]);
  await page.getByRole("button", { name: "Posłuchaj", exact: true }).click(); // plays the saved file, no new call
  await page.waitForTimeout(300);
  expect(texts.length).toBe(1);
});
