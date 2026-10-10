import { test, expect } from "@playwright/test";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
);
test("private gallery, two-file batch queue, viewport selection and mobile layout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() =>
    localStorage.setItem(
      "sb-test-auth-token",
      JSON.stringify({
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_at: 4102444800,
        expires_in: 3600,
        token_type: "bearer",
        user: {
          id: "11111111-1111-4111-8111-111111111111",
          email: "tester@example.com",
          aud: "authenticated",
          role: "authenticated",
          app_metadata: {},
          user_metadata: {},
          created_at: "2026-10-11",
        },
      }),
    ),
  );
  const image = "data:image/png;base64," + png.toString("base64");
  const photo = {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Family portrait",
    year: "1910",
    location: "Paris",
    context: "Family album",
    createdAt: "2026-10-11T00:00:00Z",
    deleting: false,
    originalUrl: image,
    versions: [
      {
        id: "44444444-4444-4444-8444-444444444444",
        status: "succeeded",
        year: "1910",
        location: "Paris",
        context: "Family album",
        error: null,
        code: null,
        createdAt: "2026-10-11T00:00:00Z",
        resultUrl: image,
      },
    ],
  };
  let saves = 0,
    jobs = 0;
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    let body: unknown;
    if (url.pathname === "/api/auth/config")
      body = {
        url: "https://test.supabase.co",
        publishableKey: "sb_publishable_test",
      };
    else if (url.pathname === "/api/auth/me")
      body = { userId: "11111111-1111-4111-8111-111111111111" };
    else if (url.pathname === "/api/version")
      body = { version: "0.3.0", commit: "test123" };
    else if (url.pathname === "/api/photos" && req.method() === "GET")
      body = { photos: [photo], hasMore: false };
    else if (url.pathname === "/api/photos" && req.method() === "POST") {
      saves++;
      body = { id: req.postDataJSON().id };
    } else if (url.pathname.endsWith("/jobs")) {
      jobs++;
      body = { id: req.postDataJSON().jobId, status: "queued" };
    } else if (url.pathname.startsWith("/api/photos/")) body = photo;
    else return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  await page.route("https://test.supabase.co/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "11111111-1111-4111-8111-111111111111",
        email: "tester@example.com",
      }),
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Gallery", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "My private gallery" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open in studio" }),
  ).toBeVisible();
  await page.getByLabel("Select photos for batch import").setInputFiles([
    { name: "first.png", mimeType: "image/png", buffer: png },
    { name: "second.png", mimeType: "image/png", buffer: png },
  ]);
  await page
    .getByRole("button", { name: "Import / retry failed uploads" })
    .click();
  await expect.poll(() => saves).toBe(2);
  await expect.poll(() => jobs).toBe(2);
  await page.getByRole("button", { name: "Open in studio" }).click();
  const viewport = page.locator(".touch-none.select-none");
  await expect(viewport).toBeVisible();
  await expect(viewport).toHaveCSS("user-select", "none");
  await expect(viewport.locator("img").first()).toHaveAttribute(
    "draggable",
    "false",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Gallery", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "My private gallery" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
  expect(errors).toEqual([]);
});
