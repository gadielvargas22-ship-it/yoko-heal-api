import { chromium } from "playwright";

export async function iniciarBrowser() {

    const browser = await chromium.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage"
        ]
    });

    const context = await browser.newContext({
        viewport: {
            width: 1400,
            height: 900
        }
    });

    const page = await context.newPage();

    page.setDefaultTimeout(60000);
page.setDefaultNavigationTimeout(60000);

    return {
        browser,
        page
    };
}