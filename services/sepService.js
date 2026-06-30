import { iniciarBrowser } from "../utils/browser.js";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 🔥 Retry real para navegación (evita timeout)
async function safeGoto(page, url) {
    for (let i = 0; i < 3; i++) {
        try {
            console.log(`Navegando (${i + 1}/3): ${url}`);

            await page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: 60000
            });

            return;
        } catch (err) {
            console.log(`Retry ${i + 1} fallido: ${err.message}`);
            await sleep(3000);
        }
    }

    throw new Error("No se pudo cargar la página: " + url);
}

export async function validarCedulaSEP(cedula) {

    if (!cedula) {
        throw new Error("No se recibió la cédula.");
    }

    const { browser, page } = await iniciarBrowser();

    try {

        console.log("=================================");
        console.log("Consultando cédula:", cedula);

        // 1. Portal principal
        await safeGoto(page, "https://profesiones.sep.gob.mx/");

        // 2. Ir a consulta pública
        const linkConsulta = page.getByRole("link", {
            name: /consulta pública/i
        });

        await linkConsulta.click();

        await page.waitForLoadState("networkidle");

        // 3. Ir a cédulas (ESTO ES EL PUNTO CRÍTICO)
        await safeGoto(page, "https://cedulaprofesional.sep.gob.mx/");

        await page.waitForLoadState("domcontentloaded");
        await sleep(2000);

        // 4. Cerrar modal si aparece
        const cerrar = page.getByRole("button", { name: "×" });
        if (await cerrar.isVisible().catch(() => false)) {
            await cerrar.click();
        }

        // 5. Seleccionar opción "cédula" (robusto)
        const opcionCedula = page
            .locator("button, a, div, span")
            .filter({ hasText: /c[eé]dula/i })
            .first();

        await opcionCedula.click();

        // 6. Input
        const input = page.getByRole("textbox", { name: /c[eé]dula/i });
        await input.waitFor({ state: "visible", timeout: 15000 });
        await input.fill(cedula);

        console.log("Cédula escrita correctamente");

        // 7. Buscar
        const botonBuscar = page.getByRole("button", { name: /buscar/i });
        await botonBuscar.click();

        console.log("Esperando resultados...");

        // 8. Espera resultados reales (mejor que timeout fijo)
        await sleep(5000);

        const filas = page.locator("tbody tr");
        const totalFilas = await filas.count();

        console.log("Filas encontradas:", totalFilas);

        if (totalFilas === 0) {
            return {
                success: false,
                valida: false,
                message: "La cédula no fue encontrada en la SEP"
            };
        }

        const data = await filas.first().locator("td").allTextContents();

        console.log("Datos obtenidos:", data);

        return {
            success: true,
            valida: true,
            numeroCedula: data[0] ?? cedula,
            nombre: data[1] ?? "",
            apellidoPaterno: data[2] ?? "",
            apellidoMaterno: data[3] ?? "",
            genero: data[4] ?? "",
            institucion: data[5] ?? "",
            profesion: data[6] ?? "",
            entidad: data[7] ?? "",
            anioRegistro: data[8] ?? "",
            fechaConsulta: new Date().toISOString(),
            fuente: "SEP"
        };

    } catch (error) {

        console.error("ERROR PLAYWRIGHT:", error);

        return {
            success: false,
            valida: false,
            message: "No se pudo consultar la cédula",
            error: error.message
        };

    } finally {
        await browser.close();
    }
}