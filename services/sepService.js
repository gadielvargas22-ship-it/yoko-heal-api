import { iniciarBrowser } from "../utils/browser.js";

export async function validarCedulaSEP(cedula) {

    if (!cedula) {
        throw new Error("No se recibió la cédula.");
    }

    const { browser, page } = await iniciarBrowser();

    try {

        console.log("=================================");
        console.log("Consultando cédula:", cedula);

        // 1. Ir al portal principal
        await page.goto("https://profesiones.sep.gob.mx/", {
    waitUntil: "networkidle",
    timeout: 60000
});

        // 2. Ir directo a la consulta pública (sin popup)
        await page.getByRole("link", {
            name: "Consulta Pública Información"
        }).click();

        await page.waitForLoadState("networkidle");

        // 3. Ir a la página de cédulas
        await page.waitForTimeout(3000);

const linkCedula = page.getByRole("link", {
    name: "Consulta Pública Información"
});

if (await linkCedula.isVisible().catch(() => false)) {
    await linkCedula.click();
}
        // 🔥 IMPORTANTE: esperar render real
        await page.waitForTimeout(2000);

        // 4. Cerrar modal si aparece
        const cerrar = page.getByRole("button", { name: "×" });
        if (await cerrar.isVisible().catch(() => false)) {
            await cerrar.click();
        }

        // 5. Seleccionar búsqueda por número
        await page.getByRole("link", {
            name: "Número de cédula"
        }).click();

        // 6. Escribir cédula
        await page.getByRole("textbox", { name: "Cédula" }).fill(cedula);

        console.log("Cédula escrita correctamente");

        // 7. Buscar
        await page.getByRole("button", { name: "Buscar" }).click();

        console.log("Esperando resultados...");

        // 8. Espera render Angular
        await page.waitForTimeout(4000);

        // 9. Validar resultados
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