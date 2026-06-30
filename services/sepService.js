import { iniciarBrowser } from "../utils/browser.js";

export async function validarCedulaSEP(cedula) {

    if (!cedula) {
        throw new Error("No se recibió la cédula.");
    }

    const { browser, page } = await iniciarBrowser();

    try {

        console.log("=================================");
        console.log("Consultando cédula:", cedula);

        // Portal principal
        await page.goto("https://profesiones.sep.gob.mx/", {
            waitUntil: "networkidle"
        });

        // Abrir consulta pública
        const [popup] = await Promise.all([
            page.waitForEvent("popup"),
            page.getByRole("link", {
                name: "Consulta Pública Información"
            }).click()
        ]);

        await popup.waitForLoadState("networkidle");

        await popup.goto(
            "https://cedulaprofesional.sep.gob.mx/",
            {
                waitUntil: "networkidle"
            }
        );

        // Cerrar aviso si aparece
        const cerrar = popup.getByRole("button", { name: "×" });

        if (await cerrar.isVisible().catch(() => false)) {
            await cerrar.click();
        }

        // Buscar por número
        await popup.getByRole("link", {
            name: "Número de cédula"
        }).click();

        // Escribir cédula
        await popup
            .getByRole("textbox", { name: "Cédula" })
            .fill(cedula);

        console.log("Cédula escrita correctamente");

        // Buscar
        await popup
            .getByRole("button", { name: "Buscar" })
            .click();

        console.log("Esperando resultados...");

        // Esperar unos segundos para que Angular renderice
        await popup.waitForTimeout(4000);

        const filas = popup.locator("tbody tr");

        const totalFilas = await filas.count();

        console.log("Filas encontradas:", totalFilas);

        if (totalFilas === 0) {

            console.log("No hubo resultados.");

            return {
                success: false,
                valida: false,
                message: "La cédula no fue encontrada en la SEP"
            };
        }

        const data = await filas.first().locator("td").allTextContents();

        console.log("Datos obtenidos:");
        console.log(data);

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

        console.error("ERROR PLAYWRIGHT");
        console.error(error);

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