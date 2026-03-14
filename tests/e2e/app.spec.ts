import { expect, test, type Page } from "@playwright/test";

const qaEmail = "qa.operator@example.com";
const qaPassword = "Warehouse123!";
const gloveProductId = "88888888-8888-8888-8888-888888888881";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(qaEmail);
  await page.getByLabel("Password").fill(qaPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
}

async function openSidebarRoute(page: Page, href: string) {
  await page.locator(`aside a[href="${href}"]`).first().click();
}

test("core screens load and sidebar routes are present", async ({ page }) => {
  await login(page);

  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();

  const screens = [
    { heading: "Inventory management", url: "/inventory" },
    { heading: "Order fulfillment workflow", url: "/orders" },
    { heading: "Inbound receiving", url: "/receiving" },
    { heading: "Picking operations", url: "/picking" },
    { heading: "Shipping operations", url: "/shipping" },
    { heading: "Track storage pressure by zone and bin.", url: "/inventory/locations" },
    { heading: "Cycle count program", url: "/cycle-counts" },
    { heading: "Returns processing", url: "/returns" },
    { heading: "Platform settings", url: "/settings" }
  ];

  for (const screen of screens) {
    await expect(page.locator(`aside a[href="${screen.url}"]`).first()).toBeVisible();
    await page.goto(screen.url);
    await expect(page).toHaveURL(new RegExp(`${screen.url.replace("/", "\\/")}$`));
    await expect(page.getByRole("heading", { name: screen.heading, exact: true })).toBeVisible();
  }
});

test("inventory search and order creation work with seeded data", async ({ page }) => {
  await login(page);

  await openSidebarRoute(page, "/inventory");
  await page.getByPlaceholder("Scan barcode or enter SKU").fill("GLV-100");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText("Industrial Gloves").first()).toBeVisible();
  await expect(page.getByText("A1-01").first()).toBeVisible();

  const orderNumber = `SO-E2E-${Date.now()}`;

  await openSidebarRoute(page, "/orders");
  await page.getByLabel("Order number").fill(orderNumber);
  await page.getByLabel("Priority").selectOption("rush");
  await page.getByLabel("Product").first().selectOption(gloveProductId);
  await page.getByLabel("Quantity").first().fill("3");
  await page.getByRole("button", { name: "Create order" }).click();
  await expect(page.getByText("Order created. Generate the pick list from the workflow board below.")).toBeVisible();
  await expect(page.getByRole("link", { name: orderNumber })).toBeVisible();
});

test("user can log out from the sidebar", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Logout" }).last().click();
  await page.waitForURL("**/login");
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
});
