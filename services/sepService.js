import { iniciarBrowser } from "../utils/browser.js";

export async function validarCedulaSEP(cedula) {

    if (!cedula) {
        throw new Error("No se recibió la cédula.");
    }

    const { browser, page } = await iniciarBrowser();

    try {

        // 1. Ir al portal
        await page.goto("https://profesiones.sep.gob.mx/");

        // 2. Ir a consulta pública
        const [popup] = await Promise.all([
            page.waitForEvent("popup"),
            page.getByRole("link", { name: "Consulta Pública Información" }).click()
        ]);

        // 3. Ir al sitio de cédulas
        await popup.goto("https://cedulaprofesional.sep.gob.mx/");

        // 4. Cerrar popup si aparece
        const cerrar = popup.getByRole("button", { name: "×" });
        if (await cerrar.isVisible().catch(() => false)) {
            await cerrar.click();
        }

        // 5. Seleccionar búsqueda por número
        await popup.getByRole("link", { name: "Número de cédula" }).click();

        // 6. Escribir cédula
        const input = popup.getByRole("textbox", { name: "Cédula" });
        await input.fill(cedula);

        // 7. Buscar
        await popup.getByRole("button", { name: "Buscar" }).click();

        // 8. Esperar resultados
        await popup.waitForSelector("tbody tr", { timeout: 15000 });

        // 9. Tomar primera fila
        const fila = popup.locator("tbody tr").first();

        const data = await fila.locator("td").allTextContents();

        const resultado = {
            success: true,
            valida: true,
            numeroCedula: data[0] || cedula,
            nombre: data[1] || "",
            apellidoPaterno: data[2] || "",
            apellidoMaterno: data[3] || "",
            genero: data[4] || "",
            institucion: data[5] || "",
            profesion: data[6] || "",
            entidad: data[7] || "",
            anioRegistro: data[8] || "",
            fechaConsulta: new Date().toISOString(),
            fuente: "SEP"
        };

        return resultado;

    } catch (error) {

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