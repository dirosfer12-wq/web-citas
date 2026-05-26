// 1. Configuración de tus credenciales de Firebase (Copia las tuyas aquí)
const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUÍ",
    authDomain: "TU_AUTH_DOMAIN_AQUÍ",
    projectId: "TU_PROJECT_ID_AQUÍ",
    storageBucket: "TU_STORAGE_BUCKET_AQUÍ",
    messagingSenderId: "TU_MESSAGING_SENDER_ID_AQUÍ",
    appId: "TU_APP_ID_AQUÍ"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.querySelector(".booking-form");

    // Credenciales de tu Bot de Telegram
    const TELEGRAM_TOKEN = "8946529974:AAHSVcKL50aghJuYeMQwAy2iViW2lx0KbSY";
    const CHAT_ID = "6553664665";

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const boton = formulario.querySelector(".btn-submit");
        boton.textContent = "Verificando disponibilidad...";
        boton.disabled = true;

        // Leer campos
        const nombre   = document.getElementById("name").value.trim();
        const email    = document.getElementById("email").value.trim();
        const fecha    = document.getElementById("date").value;
        const hora     = document.getElementById("time").value;
        const notas    = document.getElementById("notes").value.trim() || "Ninguna";

        // Llave única para el control de horarios
        const idHorario = `${fecha}_${hora}`;

        try {
            // 2. CONTROL TOTAL: Consultar a la nube si este horario ya existe
            const docRef = db.collection("citas").doc(idHorario);
            const documento = await docRef.get();

            if (documento.exists) {
                // Si ya existe en Google Firebase, detenemos todo
                alert("❌ Este horario ya fue reservado por otro cliente. Por favor selecciona otra hora.");
                boton.textContent = "Confirmar Cita";
                boton.disabled = false;
                return;
            }

            // 3. SI ESTÁ LIBRE: Lo guardamos inmediatamente en la base de datos
            await docRef.set({
                nombre: nombre,
                email: email,
                fecha: fecha,
                hora: hora,
                notas: notas,
                creadoEl: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 4. Formatear fecha y enviar la notificación a tu Telegram
            const [anio, mes, dia] = fecha.split("-");
            const fechaLegible = `${dia}/${mes}/${anio}`;

            const mensajeText = 
                `🤖 *¡NUEVA CITA CONFIRMADA EN BASE DE DATOS!*\n` +
                `────────────────────\n` +
                `👤 *Cliente:* ${nombre}\n` +
                `📧 *Correo:* ${email}\n` +
                `📅 *Fecha:* ${fechaLegible}\n` +
                `⏰ *Hora:* ${hora}\n` +
                `📝 *Notas:* ${notas}\n` +
                `────────────────────`;

            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: mensajeText,
                    parse_mode: "Markdown"
                })
            });

            alert("¡Perfecto! Tu cita ha sido agendada y asegurada.");
            formulario.reset();

        } catch (error) {
            console.error("Error en el proceso:", error);
            alert("Hubo un error en el servidor. Inténtalo de nuevo.");
        } finally {
            boton.textContent = "Confirmar Cita";
            boton.disabled = false;
        }
    });
});