import { test, expect, type Page } from "@playwright/test";

// No paid ElevenLabs call may ever happen during tests.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/eleven/**", (route) => {
    throw new Error(`Unexpected paid API call: ${route.request().url()}`);
  });
});

async function onboard(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Zacznij spokojnie" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Marek");
}

const go = (page: Page, hash: string) => page.evaluate((h) => (location.hash = h), hash);

test("first run → Today", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("to jest miejsce, w którym niczego nie musisz osiągać")).toBeVisible();
  await page.getByRole("button", { name: "Zacznij spokojnie" }).click();
  await expect(page.getByText("Keep Your Nervous System Healthy").first()).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Główna nawigacja" })).toBeVisible();
});

test("START and CLOSE rituals set the work status and allow resuming", async ({ page }) => {
  await onboard(page);
  await page.getByRole("radio", { name: "Praca" }).click();
  await page.getByRole("button", { name: /Start day/i }).click();
  await expect(page.getByRole("heading", { name: "Start your day, Marek." })).toBeVisible();
  await page.getByRole("button", { name: "Rozpocznij dzień" }).click();
  await expect(page.getByText("Dzisiaj mogę działać z ciekawością, ale bez pośpiechu.")).toBeVisible();
  await page.getByRole("button", { name: "Wróć do dnia" }).click();
  await expect(page.getByText(/Zaczęty o/)).toBeVisible();

  await page.getByRole("button", { name: /Close day/i }).click();
  await expect(page.getByRole("heading", { name: "Na dzisiaj wystarczy, Marek." })).toBeVisible();
  await page.getByRole("button", { name: "Zamknij dzień" }).click();
  await expect(page.getByText("Wojna się skończyła.")).toBeVisible();
  await page.getByRole("button", { name: "Wróć do dnia" }).click({ timeout: 15_000 });
  await expect(page.getByText("Status: po pracy")).toBeVisible();
  await page.getByRole("button", { name: "Wznów pracę" }).click();
  await expect(page.getByText("Status: po pracy")).toHaveCount(0);
});

test("rhythm items can be ticked, shifted, edited and deleted", async ({ page }) => {
  await onboard(page);
  await page.getByRole("radio", { name: "Praca" }).click();
  await page.getByRole("button", { name: "Odhacz: Spokojny poranek" }).click();
  await expect(page.getByRole("button", { name: "Cofnij: Spokojny poranek" })).toBeVisible();
  await page.getByRole("button", { name: /12:30 Krótka przerwa bez ekranu/ }).click();
  await page.getByRole("button", { name: "Przesuń o 30 min" }).click();
  await expect(page.getByRole("button", { name: /13:00 Krótka przerwa bez ekranu/ })).toBeVisible();
  await page.getByRole("button", { name: /13:00 Krótka przerwa/ }).click();
  await page.getByRole("button", { name: "Usuń", exact: true }).click();
  await expect(page.getByText("Krótka przerwa bez ekranu")).toHaveCount(0);
  await page.getByRole("radio", { name: "Kalendarz" }).click();
  await expect(page.getByRole("button", { name: "Następny miesiąc" })).toBeVisible();
});

test("breath session animates in real time, pauses, and ends without judgement", async ({ page }) => {
  await onboard(page);
  await page.getByRole("button", { name: "Oddech", exact: true }).click();
  await page.getByRole("radio", { name: "Cisza" }).click();
  await page.getByRole("radio", { name: "2 min" }).click();
  await page.getByRole("button", { name: "Zacznij", exact: true }).click();
  const disc = page.locator("svg circle").nth(1);
  const t1 = await disc.getAttribute("transform");
  await page.waitForTimeout(1500);
  const t2 = await disc.getAttribute("transform");
  expect(t1).not.toEqual(t2);
  await expect(page.getByText("Wdech", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pauza" }).click();
  await page.waitForTimeout(200); // let the last animation frame settle
  const p1 = await disc.getAttribute("transform");
  await page.waitForTimeout(1200);
  expect(await disc.getAttribute("transform")).toEqual(p1);
  await page.getByRole("button", { name: "Kontynuuj" }).click();
  await page.getByRole("button", { name: "Zakończ" }).click();
  await expect(page.getByText("Możesz wrócić do swojego dnia.")).toBeVisible();
});

test("yoga session runs, skips and finishes", async ({ page }) => {
  await onboard(page);
  await go(page, "#/yoga/run/s10");
  await expect(page.getByText("Krok 1 z 8")).toBeVisible();
  await page.getByRole("button", { name: "Wyłącz głos" }).click();
  await page.getByRole("button", { name: "Zacznij sesję" }).click();
  await expect(page.getByLabel(/Pozostało 0:5\d|Pozostało 1:00/)).toBeVisible();
  await page.getByRole("button", { name: "Wydłuż o 30 sekund" }).click();
  await expect(page.getByLabel(/Pozostało 1:[23]\d/)).toBeVisible();
  await page.getByRole("button", { name: /Następna pozycja/ }).click();
  await expect(page.getByText("Krok 2 z 8")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kot–krowa" })).toBeVisible();
  await page.getByRole("button", { name: "Zakończ", exact: true }).click();
  await expect(page.getByText("Możesz wrócić do swojego dnia.")).toBeVisible();
});

test("idea goes to the parking and survives a reload", async ({ page }) => {
  await onboard(page);
  await go(page, "#/letgo");
  await page.getByRole("button", { name: /Mam nowy pomysł/ }).click();
  await page.getByRole("button", { name: "Zapiszę pomysł na później." }).click();
  await page.getByLabel("Jeden pomysł = jedno zdanie").fill("Aplikacja do wspólnych wyjazdów");
  await page.getByRole("button", { name: "Zaparkuj pomysł" }).click();
  await expect(page.getByText("Pomysł jest bezpieczny w parkingu.")).toBeVisible();
  await page.waitForTimeout(500);
  await page.reload();
  await go(page, "#/ideas");
  await expect(page.getByText("Aplikacja do wspólnych wyjazdów")).toBeVisible();
});

test("paid generation never runs without a voice and confirmation", async ({ page }) => {
  await onboard(page);
  await go(page, "#/audio/present");
  await page.getByRole("button", { name: "Wygeneruj narrację" }).click();
  await expect(page.getByText("Najpierw wybierz głos")).toBeVisible();
  await go(page, "#/settings/sounds");
  await page.getByRole("button", { name: "Generuj START" }).click();
  await expect(page.getByRole("heading", { name: "Płatna generacja ElevenLabs" })).toBeVisible();
  await page.getByRole("button", { name: "Anuluj" }).click();
  await expect(page.getByRole("heading", { name: "Płatna generacja ElevenLabs" })).toHaveCount(0);
});

test("mantras: favourite, pin and choose for today", async ({ page }) => {
  await onboard(page);
  await go(page, "#/mantras");
  await page.getByRole("button", { name: "Leon nie będzie drugi raz w tym wieku." }).click();
  await page.getByRole("button", { name: /Na dziś/ }).click();
  await page.keyboard.press("Escape");
  await go(page, "#/today");
  await expect(page.getByRole("button", { name: /Mantra dnia: Leon nie będzie drugi raz w tym wieku/ })).toBeVisible();
});

test("trip mode minimises the interface", async ({ page }) => {
  await onboard(page);
  await go(page, "#/trip");
  await page.getByRole("button", { name: "Rozpocznij tryb wyjazdu" }).click();
  await expect(page.getByText("Odłączenie")).toBeVisible();
  await expect(page.getByText("Dzisiejszy rytm")).toHaveCount(0);
  await expect(page.getByText("Jedno ćwiczenie")).toBeVisible();
});

test("data export downloads a backup", async ({ page }) => {
  await onboard(page);
  await go(page, "#/settings/data");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Eksportuj kopię/ }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^decompressly-\d{4}-\d{2}-\d{2}\.json$/);
});

test("works offline after the first visit", async ({ page, context }) => {
  await onboard(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(1500);
  await page.reload(); // now controlled by the service worker
  await page.waitForTimeout(1000);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Marek");
  await go(page, "#/yoga");
  await expect(page.getByText("Biblioteka pozycji")).toBeVisible();
  await context.setOffline(false);
});
