import { chromium } from "playwright";

export async function iniciarBrowser() {

    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });

    const context = await browser.newContext({

        viewport: {
            width: 1400,
            height: 900
        }

    });

    const page = await context.newPage();

    page.setDefaultTimeout(30000);

    return {
        browser,
        page
    };

}