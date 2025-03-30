const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const nodemailer = require('nodemailer');

const conf = JSON.parse(fs.readFileSync('conf.json'));
const token = conf.key;

const bot = new TelegramBot(token, { polling: true });
console.log("Bot attivo");

let users = {};

// Configurazione di nodemailer -> in questo caso la mail utilizzata è di Libero.it
const transporter = nodemailer.createTransport({
    host: 'smtp.libero.it',
    port: 587,
    secure: false,
    auth: {
      user: conf.emailUser,
      pass: conf.emailPass,
    },
    tls: {
      rejectUnauthorized: false
    }
});

bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") {
        bot.sendMessage(chatId, `Ciao, benvenuto!👋\nCon questo bot puoi inviare email. Usa il comando:\n/sendmail "destinatario@mail.com"|Oggetto|Corpo del messaggio`);
    }

    if (text.startsWith("/sendmail")) {
        const params = text.split(' ').slice(1).join(' ');
        const parti = params.split('|');

        const to = parti[0];
        const subject = parti[1];
        const body = parti[2];

        if (!to || !subject || !body) {
            return bot.sendMessage(chatId, '❌ Formato non valido. Usa:\n/sendmail "destinatario@mail.com"|Oggetto|Corpo del messaggio');
        }

        users[chatId] = { to, subject, body, statoPassword: true };
        bot.sendMessage(chatId, "🔒 Inserisci la password per confermare l'invio dell'email:");
        return;
    }

    if (users[chatId] && users[chatId].statoPassword) {
        if (text === conf.password) {
            const { to, subject, body } = users[chatId];

            transporter.sendMail({
                from: conf.emailUser,
                to,
                subject,
                text: body,
                html: `${body}`,
            }).then(() => {
                bot.sendMessage(chatId, "✅ Email inviata con successo!");
            }).catch(error => {
                bot.sendMessage(chatId, "❌ Errore nell'invio dell'email: " + error.message);
            });
        } else {
            bot.sendMessage(chatId, "❌ Password errata! Email non inviata.");
        }
        delete userState[chatId];
    }
});