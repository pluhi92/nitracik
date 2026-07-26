// services/emailService.js
const nodemailer = require('nodemailer');
const path = require('path');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
require('dayjs/locale/sk');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('sk');

// Nastavenie adresy odosielateľa z Google Workspace
const SENDER = 'Nitráčik <info@nitracik.sk>';

// Konfigurácia odosielateľa
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Explicitný host namiesto service: 'gmail'
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  // TOTO JE KĽÚČOVÉ PRE ODSTRÁNENIE LOADING PROBLÉMU:
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  debug: false,
  logger: false
});

// SMTP overenie pri štarte nespúšťame počas testov, aby sa neobjavovali
// oneskorené logy po ukončení testov (Jest "Cannot log after tests are done").
const shouldVerifyTransportOnStartup =
  process.env.NODE_ENV !== 'test'
  && !process.env.JEST_WORKER_ID
  && process.env.EMAIL_VERIFY_ON_STARTUP !== 'false';

if (shouldVerifyTransportOnStartup) {
  transporter.verify((error) => {
    if (error) {
      console.error('❌ CRITICAL: Email server connection failed:', error.message);
    } else {
      console.log('✅ Email server is ready to send messages');
    }
  });
}

// Verejné URL obrázkov (backend static files)
const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/images`;
const IMAGE_URLS = {
  logo: `${IMAGE_BASE_URL}/email/logo_bez.PNG`,
  instagram: `${IMAGE_BASE_URL}/email/instagram.png`,
  facebook: `${IMAGE_BASE_URL}/email/facebook.png`
};

const GOOGLE_REVIEW_URL = 'https://g.page/r/CbI1YWF7cCHfEBM/review';

const COMPATIBLE_CHILD_CREDIT_TYPES = new Set(['MINI', 'MIDI', 'MAXI']);
const normalizeTrainingTypeName = (value) => (value || '').toString().trim().toUpperCase();
const isMiniMidiMaxiType = (trainingType) => COMPATIBLE_CHILD_CREDIT_TYPES.has(normalizeTrainingTypeName(trainingType));

const getMiniMidiMaxiCreditNoticeHtml = (trainingType) => {
  if (!isMiniMidiMaxiType(trainingType)) {
    return '';
  }

  return `
    <div style="margin-top: 12px; padding: 10px; background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; color: #92400e; font-size: 13px;">
      <strong>Informácia ku kreditu:</strong> Tento kredit môžete využiť na hodiny MINI, MIDI alebo MAXI.
    </div>
  `;
};

const injectImageUrls = (html) =>
  html
    .replaceAll('cid:nitracikLogo', IMAGE_URLS.logo)
    .replaceAll('cid:igIcon', IMAGE_URLS.instagram)
    .replaceAll('cid:fbIcon', IMAGE_URLS.facebook);

// Pomocné konštanty (bez príloh)
const getCommonAttachments = () => [];

// Pomocná funkcia na získanie zoznamu prihlásených na danú hodinu
const getAttendeesList = async (trainingId) => {
  const { Pool } = require('pg');
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    // Query na získanie všetkých prihlásených + info o tréningu
    const result = await pool.query(`
      SELECT 
        ta.training_type,
        ta.training_date,
        ta.max_participants,
        u.first_name,
        u.last_name,
        u.email,
        b.number_of_children,
        b.booking_type,
        COALESCE(SUM(b.number_of_children) OVER (PARTITION BY ta.id), 0) AS total_children
      FROM training_availability ta
      LEFT JOIN bookings b ON ta.id = b.training_id AND b.active = true
      LEFT JOIN users u ON b.user_id = u.id
      WHERE ta.id = $1
      ORDER BY b.booked_at ASC
    `, [trainingId]);

    if (result.rows.length === 0) {
      return { html: '', trainingInfo: null };
    }

    const firstRow = result.rows[0];
    const trainingDate = dayjs(firstRow.training_date).tz('Europe/Bratislava');
    const formattedDate = trainingDate.format('DD.MM.YYYY');
    const dayName = trainingDate.format('dddd');
    const time = trainingDate.format('HH:mm');

    const maxParticipants = firstRow.max_participants;
    const totalBooked = parseInt(firstRow.total_children) || 0;
    const availableSpots = maxParticipants - totalBooked;

    // Filtrovanie riadkov kde existuje booking
    const attendees = result.rows.filter(row => row.first_name);

    let tableRows = '';
    attendees.forEach((row, index) => {
      const bookingTypeText =
        row.booking_type === 'paid' ? 'Zaplatená' :
          row.booking_type === 'gift_card' ? 'Zaplatená' :
            row.booking_type === 'season_ticket' ? 'Permanentka' :
              row.booking_type === 'credit' ? 'Kredit' : 'Neznámy typ';

      tableRows += `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px; font-size: 14px;">${index + 1}.</td>
          <td style="padding: 10px; font-size: 14px;">${row.first_name} ${row.last_name}</td>
          <td style="padding: 10px; text-align: center; font-size: 14px;">${row.number_of_children}</td>
          <td style="padding: 10px; font-size: 14px;">${bookingTypeText}</td>
          <td style="padding: 10px; font-size: 14px;"><a href="mailto:${row.email}" style="color: #2563eb; text-decoration: none;">${row.email}</a></td>
        </tr>
      `;
    });

    const html = `
      <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 6px; border: 2px solid #eab308;">
        <h3 style="margin-top: 0; color: #2563eb; font-size: 16px;">
          📋 ZOZNAM PRIHLÁSENÝCH - ${firstRow.training_type} - ${formattedDate} (${dayName}) | ${time}
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 4px; overflow: hidden;">
          <thead>
            <tr style="background-color: #eab308;">
              <th style="padding: 12px; text-align: left; font-size: 14px; color: white;">#</th>
              <th style="padding: 12px; text-align: left; font-size: 14px; color: white;">Meno</th>
              <th style="padding: 12px; text-align: center; font-size: 14px; color: white;">Počet detí</th>
              <th style="padding: 12px; text-align: left; font-size: 14px; color: white;">Typ rezervácie</th>
              <th style="padding: 12px; text-align: left; font-size: 14px; color: white;">Email</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #6b7280;">Zatiaľ žiadne prihlásenia</td></tr>'}
          </tbody>
        </table>
        
        <div style="margin-top: 15px; padding: 12px; background-color: ${availableSpots > 0 ? '#d1fae5' : '#fee2e2'}; border-radius: 4px; text-align: center;">
          <strong style="color: ${availableSpots > 0 ? '#065f46' : '#991b1b'}; font-size: 15px;">
            Dostupné miesta na túto hodinu: ${availableSpots} / ${maxParticipants}
          </strong>
        </div>
      </div>
    `;

    return {
      html,
      trainingInfo: {
        type: firstRow.training_type,
        date: formattedDate,
        day: dayName,
        time: time,
        totalBooked,
        availableSpots,
        maxParticipants
      }
    };

  } catch (error) {
    console.error('Error fetching attendees list:', error);
    return { html: '', trainingInfo: null };
  } finally {
    // Dôležité: Ukončenie pripojenia do DB, aby sa nezahĺtil pool
    await pool.end();
  }
};

module.exports = {
  // 1. Overovací email
  sendVerificationEmail: async (userEmail, userName, verificationLink) => {
    const subject = 'Vitajte v Nitráčiku - Overenie emailu';
    const mailOptions = {
      from: SENDER,
      to: userEmail,
      subject,
      html: injectImageUrls(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
            .content { padding: 30px; color: #333333; line-height: 1.6; text-align: justify; }
            .highlight-box { background-color: #fefce8; border: 1px solid #fde047; border-radius: 6px; padding: 20px; margin: 25px 0; text-align: center; font-style: italic; }
            .btn-verify { display: block; width: 200px; margin: 20px auto; padding: 12px 20px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; text-align: center; font-weight: bold; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
            p { margin-bottom: 15px; }
            .quote-en { color: #d97706; font-weight: bold; font-size: 18px; display: block; margin-bottom: 5px; }
            .quote-sk { color: #555; font-size: 16px; }
          </style>
        </head>
        <body>
          <div style="background-color: #f4f4f4; padding: 40px 0;">
            <div class="container">
              <div class="header">
                <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
              </div>
              <div class="content">
                <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: left;">Dobrý deň, ${userName}.</p>
                <p>Vitajte v Nitráčiku! Sme veľmi radi, že sa k nám pridávate.</p> 
                <p>Už Vám chýba len jeden malý krok, aby ste sa mohli naplno ponoriť do nášho sveta plného farieb a zmysluplnej zábavy. Prosím, potvrďte svoju registráciu kliknutím na tlačidlo nižšie:</p>
                <a href="${verificationLink}" class="btn-verify">OVERIŤ EMAIL</a>
                <p style="text-align: center; font-size: 12px; color: #999;">Ak tlačidlo nefunguje, skopírujte tento odkaz do prehliadača:<br/>${verificationLink}</p>
                <div class="highlight-box">
                   <span class="quote-en">"Wow, look at all the colors you're mixing!"</span>
                   <span class="quote-sk">"Jéj, pozri na tie farby, čo miešaš!"</span>
                </div>
                <div style="margin-top: 30px;">
                  <p style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #ef3f3f; margin-bottom: 5px;">Saška</p>
                  <p style="font-size: 14px; margin: 0;"><strong>JUDr. Košičárová Alexandra</strong></p>
                  <p style="font-size: 13px; color: #666; margin: 0;">Štatutárka a zakladateľka O.z. Nitráčik</p>
                </div>
              </div>
              <div class="footer">
                <div style="margin-bottom: 15px;">
                  <a href="https://www.instagram.com/nitracik/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:igIcon" alt="Instagram" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                  <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:fbIcon" alt="Facebook" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                </div>
                <p style="margin: 0;">© 2026 O.z. Nitráčik.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `),
      attachments: getCommonAttachments()
    };
    return transporter.sendMail(mailOptions);
  },


  // 2. Booking email (UPRAVENÉ PRE PERMANENTKY)
  sendUserBookingEmail: async (userEmail, sessionDetails) => {
    const userName = sessionDetails.userName || 'Osôbka';
    const bookingDate = dayjs(sessionDetails.date).tz('Europe/Bratislava').format('DD.MM.YYYY');
    const bookingDay = dayjs(sessionDetails.date).tz('Europe/Bratislava').format('dddd');
    const formattedDateString = `${bookingDate} (${bookingDay})`;

    const SUBJECTS = {
      credit: 'Rezervácia – uhradená kreditom | Nitráčik',
      season_ticket: 'Rezervácia – uplatnený permanentný vstup | Nitráčik',
      gift_card: 'Potvrdenie rezervácie – darčekový poukaz | Nitráčik',
      payment: 'Potvrdenie rezervácie | Nitráčik'
    };
    const PAYMENT_TEXT = {
      credit: 'rezervácia bola uhradená z vášho kreditu',
      season_ticket: 'rezervácia bola odpočítaná z permanentného vstupu',
      gift_card: 'rezervácia bola úspešne uhradená darčekovým poukazom',
      payment: 'platba prebehla úspešne'
    };

    const pType = sessionDetails.paymentType || 'payment';
    const subject = SUBJECTS[pType] || SUBJECTS['payment'];
    const paymentInfo = PAYMENT_TEXT[pType] || PAYMENT_TEXT['payment'];
    const creditCompatibilityNotice = pType === 'credit'
      ? getMiniMidiMaxiCreditNoticeHtml(sessionDetails.trainingType)
      : '';

    // === NOVÉ: SEASON TICKET INFO ===
    let seasonTicketRows = '';
    // Skontrolujeme, či máme dáta o permanentke (posielame ich teraz zo server.js)
    if (pType === 'season_ticket' && sessionDetails.remainingEntries !== undefined) {
      const expiryFormatted = dayjs(sessionDetails.expiryDate).tz('Europe/Bratislava').format('DD.MM.YYYY');
      seasonTicketRows = `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #eab308;">
          <div style="color: #9333ea; font-weight: bold; margin-bottom: 5px;">🎫 Stav permanentky:</div>
          <div class="highlight-item">Použité vstupy teraz: <strong>${sessionDetails.usedEntries}</strong></div>
          <div class="highlight-item">Zostávajúce vstupy: <strong>${sessionDetails.remainingEntries} / ${sessionDetails.totalEntries}</strong></div>
          <div class="highlight-item" style="font-size: 13px; color: #666;">Platnosť do: ${expiryFormatted}</div>
        </div>
      `;
    }
    // ================================

    // === DARČEKOVÝ POUKAZ INFO ===
    let giftCardRow = '';
    if (pType === 'gift_card' && sessionDetails.giftCardBalance !== undefined) {
      giftCardRow = `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #f59e0b;">
          <div style="color: #d97706; font-weight: bold; margin-bottom: 5px;">🎁 Darčekový poukaz:</div>
          <div class="highlight-item">Uhradené poukazom: <strong>${sessionDetails.giftCardDiscount ? sessionDetails.giftCardDiscount.toFixed(2) : '0.00'} €</strong></div>
          <div class="highlight-item">Zostatok na poukaze: <strong>${Number(sessionDetails.giftCardBalance).toFixed(2)} €</strong></div>
        </div>
      `;
    }
    // ================================

    // === TÉMA ===
    let themeRow = '';
    if (sessionDetails.theme) {
      themeRow = `
        <div class="highlight-item">
          🎨 <strong>Téma:</strong> ${sessionDetails.theme}
        </div>
      `;
    }
    // =============

    const mailOptions = {
      from: SENDER,
      to: userEmail,
      subject,
      html: injectImageUrls(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
            .content { padding: 30px; color: #333333; line-height: 1.6; text-align: justify; }
            .highlight-box { background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: left; }
            .highlight-item { margin-bottom: 5px; font-size: 15px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
            p { margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div style="background-color: #f4f4f4; padding: 40px 0;">
            <div class="container">
              <div class="header">
                <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
              </div>
              <div class="content">
                <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: left;">Dobrý deň, ${userName}.</p>
                <p>Prinášam dobrú správu, že vaša ${paymentInfo} za <strong>MESSY&SENSORY play NITRÁČIK - ${sessionDetails.trainingType || 'Tréning'}</strong>.</p>
                
                <div class="highlight-box">
                  <div class="highlight-item">📅 <strong>Dátum:</strong> ${formattedDateString}</div>
                  <div class="highlight-item">⏰ <strong>Čas:</strong> ${sessionDetails.start_time || sessionDetails.time}</div>
                  ${themeRow}
                  <div class="highlight-item">📍 <strong>Miesto:</strong> 
                      <a href="https://www.google.com/maps/search/?api=1&query=Štefánikova+trieda+148,+Nitra" 
                        style="color: #2563eb; text-decoration: underline;">
                        Štefánikova trieda 148, Nitra</a>
                  </div>
                  
                  ${seasonTicketRows}
                  ${giftCardRow}
                  ${creditCompatibilityNotice}
                  
                </div>

                <p>Teším sa na kopu krásnych ufúľaných momentov.</p> 
                <p>Skvelé bude, ak so sebou prinesiete náhradné oblečenie, ktoré možno ušpiniť a malý uteráčik.</p>
                <p>Odporúčam vziať gumené šľapky aj pre sprevádzajúcu osobu, ktoré zvládnu aj klzký terén, nakoľko vodné a podobné aktivity sú a budú pevnou súčasťou hodín 😉.</p>
                <p>Prosím o dochvíľnosť, aby Vám neušla ani jedna zaujímavá chvíľa 🙃. Herný priestor sa sprístupní až v momente dohodnutého času, aby mali všetky detičky rovnaký “štart” a naplno si mohli vychutnať pekne pripravené stanovištia.</p>
                <p>Vstup je cez vnútorné átrium, takže neklopkajte na prvé dvere, ale pokračujte cez bráničku, na ktorej vás bude vítať tabuľka <strong>“VITAJTE U NITRÁČIKA”</strong>.</p>
                <p>Parkovanie je zadarmo pred budovou alebo zboku v areáli železníc.</p>
                <p>Ďakujem za dôveru a podporu a teším sa na osobné stretnutie.</p>
                
                <div style="margin-top: 30px;">
                  <p style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #ef3f3f; margin-bottom: 5px;">Saška</p>
                  <p style="font-size: 14px; margin: 0;"><strong>JUDr. Košičárová Alexandra</strong></p>
                  <p style="font-size: 13px; color: #666; margin: 0;">Štatutárka a zakladateľka O.z. Nitráčik</p>
                  <p style="font-size: 13px; color: #666; margin: 0;">+421 949 584 576</p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; line-height: 1.5;">
                  <p style="margin: 0 0 8px 0;"><strong>Súhlas so začatím poskytovania služby:</strong></p>
                  <p style="margin: 0;">Týmto potvrdzujem, že som pri objednávke udelil/a súhlas so začatím poskytovania služby pred uplynutím lehoty na odstúpenie od zmluvy v zmysle § 7 ods. 1 zákona č. 102/2014 Z.z. o ochrane spotrebiteľa pri predaji tovaru alebo poskytovaní služieb na základe zmluvy uzavretej na diaľku alebo zmluvy uzavretej mimo prevádzkových priestorov predávajúceho a o zmene a doplnení niektorých zákonov. Bol/a som poučený/á o tom, že v prípade uplatnenia tohto súhlasu stratím právo odstúpiť od zmluvy v zmysle § 7 ods. 6 písm. l) uvedeného zákona, ak bude služba v plnom rozsahu poskytnutá.</p>
                </div>
              </div>
              <div class="footer">
                <div style="margin-bottom: 15px;">
                   <a href="https://www.instagram.com/nitracik/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:igIcon" alt="Instagram" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                  <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:fbIcon" alt="Facebook" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                </div>
                <p style="margin: 0;">© 2026 O.z. Nitráčik. Všetky práva vyhradené.</p>
                <p style="margin: 5px 0 0 0;">info@nitracik.sk</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `),
      attachments: getCommonAttachments()
    };
    return transporter.sendMail(mailOptions);
  },

  // 2b. Booking email pre dospelých (prispôsobený obsah)
  sendAdultBookingEmail: async (userEmail, sessionDetails) => {
    const userName = sessionDetails.userName || 'Osôbka';
    const bookingDate = dayjs(sessionDetails.date).tz('Europe/Bratislava').format('DD.MM.YYYY');
    const bookingDay = dayjs(sessionDetails.date).tz('Europe/Bratislava').format('dddd');
    const formattedDateString = `${bookingDate} (${bookingDay})`;

    const SUBJECTS = {
      credit: 'Rezervácia – uhradená kreditom | Nitráčik',
      season_ticket: 'Rezervácia – uplatnený permanentný vstup | Nitráčik',
      gift_card: 'Potvrdenie rezervácie – darčekový poukaz | Nitráčik',
      payment: 'Potvrdenie rezervácie | Nitráčik'
    };
    const PAYMENT_TEXT = {
      credit: 'rezervácia bola uhradená z vášho kreditu',
      season_ticket: 'rezervácia bola odpočítaná z permanentného vstupu',
      gift_card: 'rezervácia bola úspešne uhradená darčekovým poukazom',
      payment: 'platba prebehla úspešne'
    };

    const pType = sessionDetails.paymentType || 'payment';
    const subject = SUBJECTS[pType] || SUBJECTS['payment'];
    const paymentInfo = PAYMENT_TEXT[pType] || PAYMENT_TEXT['payment'];
    const creditCompatibilityNotice = pType === 'credit'
      ? getMiniMidiMaxiCreditNoticeHtml(sessionDetails.trainingType)
      : '';

    // === SEASON TICKET INFO ===
    let seasonTicketRows = '';
    if (pType === 'season_ticket' && sessionDetails.remainingEntries !== undefined) {
      const expiryFormatted = dayjs(sessionDetails.expiryDate).tz('Europe/Bratislava').format('DD.MM.YYYY');
      seasonTicketRows = `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #eab308;">
          <div style="color: #9333ea; font-weight: bold; margin-bottom: 5px;">🎫 Stav permanentky:</div>
          <div class="highlight-item">Použité vstupy teraz: <strong>${sessionDetails.usedEntries}</strong></div>
          <div class="highlight-item">Zostávajúce vstupy: <strong>${sessionDetails.remainingEntries} / ${sessionDetails.totalEntries}</strong></div>
          <div class="highlight-item" style="font-size: 13px; color: #666;">Platnosť do: ${expiryFormatted}</div>
        </div>
      `;
    }

    // === DARČEKOVÝ POUKAZ INFO ===
    let giftCardRow = '';
    if (pType === 'gift_card' && sessionDetails.giftCardBalance !== undefined) {
      giftCardRow = `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #f59e0b;">
          <div style="color: #d97706; font-weight: bold; margin-bottom: 5px;">🎁 Darčekový poukaz:</div>
          <div class="highlight-item">Uhradené poukazom: <strong>${sessionDetails.giftCardDiscount ? sessionDetails.giftCardDiscount.toFixed(2) : '0.00'} €</strong></div>
          <div class="highlight-item">Zostatok na poukaze: <strong>${Number(sessionDetails.giftCardBalance).toFixed(2)} €</strong></div>
        </div>
      `;
    }
    // ================================

    // === TÉMA (len pre detské tréningy, pre dospelých nie) ===
    let themeRow = '';
    if (sessionDetails.theme) {
      themeRow = `
        <div class="highlight-item">
          🎨 <strong>Téma:</strong> ${sessionDetails.theme}
        </div>
      `;
    }
    // =============

    const mailOptions = {
      from: SENDER,
      to: userEmail,
      subject,
      html: injectImageUrls(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
            .content { padding: 30px; color: #333333; line-height: 1.6; text-align: justify; }
            .highlight-box { background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: left; }
            .highlight-item { margin-bottom: 5px; font-size: 15px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
            p { margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div style="background-color: #f4f4f4; padding: 40px 0;">
            <div class="container">
              <div class="header">
                <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
              </div>
              <div class="content">
                <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: left;">Dobrý deň, ${userName}.</p>
                <p>Prinášam dobrú správu, že vaša ${paymentInfo} za <strong>${sessionDetails.trainingType || 'Tréning pre dospelých'} - NITRÁČIK</strong>.</p>
                
                <div class="highlight-box">
                  <div class="highlight-item">📅 <strong>Dátum:</strong> ${formattedDateString}</div>
                  <div class="highlight-item">⏰ <strong>Čas:</strong> ${sessionDetails.start_time || sessionDetails.time}</div>
                  ${themeRow}
                  <div class="highlight-item">📍 <strong>Miesto:</strong> 
                      <a href="https://www.google.com/maps/search/?api=1&query=Štefánikova+trieda+148,+Nitra" 
                        style="color: #2563eb; text-decoration: underline;">
                        Štefánikova trieda 148, Nitra</a>
                  </div>
                  
                  ${seasonTicketRows}
                  ${giftCardRow}
                  ${creditCompatibilityNotice}
                  
                </div>

                <p>Teším sa na stretnutie s Vami a na príjemné chvíle strávené spolu.</p> 
                <p>Odporúčam vziať si pohodlné oblečenie, v ktorom sa budete cítiť príjemne počas celého tréningu.</p>
                <p>Prosím o dochvíľnosť, aby sme mohli začať presne v dohodnutom čase. Priestor sa sprístupní až v momente dohodnutého času, aby mali všetci účastníci rovnaký "štart".</p>
                <p>Vstup je cez vnútorné átrium, takže neklopkajte na prvé dvere, ale pokračujte cez bráničku, na ktorej vás bude vítať tabuľka <strong>"VITAJTE U NITRÁČIKA"</strong>.</p>
                <p>Parkovanie je zadarmo pred budovou alebo zboku v areáli železníc.</p>
                <p>Ďakujem za dôveru a teším sa na osobné stretnutie.</p>
                
                <div style="margin-top: 30px;">
                  <p style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #ef3f3f; margin-bottom: 5px;">Saška</p>
                  <p style="font-size: 14px; margin: 0;"><strong>JUDr. Košičárová Alexandra</strong></p>
                  <p style="font-size: 13px; color: #666; margin: 0;">Štatutárka a zakladateľka O.z. Nitráčik</p>
                  <p style="font-size: 13px; color: #666; margin: 0;">+421 949 584 576</p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; line-height: 1.5;">
                  <p style="margin: 0 0 8px 0;"><strong>Súhlas so začatím poskytovania služby:</strong></p>
                  <p style="margin: 0;">Týmto potvrdzujem, že som pri objednávke udelil/a súhlas so začatím poskytovania služby pred uplynutím lehoty na odstúpenie od zmluvy v zmysle § 7 ods. 1 zákona č. 102/2014 Z.z. o ochrane spotrebiteľa pri predaji tovaru alebo poskytovaní služieb na základe zmluvy uzavretej na diaľku alebo zmluvy uzavretej mimo prevádzkových priestorov predávajúceho a o zmene a doplnení niektorých zákonov. Bol/a som poučený/á o tom, že v prípade uplatnenia tohto súhlasu stratím právo odstúpiť od zmluvy v zmysle § 7 ods. 6 písm. l) uvedeného zákona, ak bude služba v plnom rozsahu poskytnutá.</p>
                </div>
              </div>
              <div class="footer">
                <div style="margin-bottom: 15px;">
                   <a href="https://www.instagram.com/nitracik/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:igIcon" alt="Instagram" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                  <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:fbIcon" alt="Facebook" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                </div>
                <p style="margin: 0;">© 2026 O.z. Nitráčik. Všetky práva vyhradené.</p>
                <p style="margin: 5px 0 0 0;">info@nitracik.sk</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `),
      attachments: getCommonAttachments()
    };
    return transporter.sendMail(mailOptions);
  },

  // 2c. Booking confirmation email pre dospelých (nový separátny email)
  sendAdultBookingConfirmationEmail: async (userEmail, sessionDetails) => {
    const userName = sessionDetails.userName || 'Osôbka';
    const bookingDate = dayjs(sessionDetails.date).tz('Europe/Bratislava').format('DD.MM.YYYY');
    const bookingDay = dayjs(sessionDetails.date).tz('Europe/Bratislava').format('dddd');
    const formattedDateString = `${bookingDate} (${bookingDay})`;

    const SUBJECTS = {
      credit: 'Rezervácia – uhradená kreditom | Nitráčik',
      season_ticket: 'Rezervácia – uplatnený permanentný vstup | Nitráčik',
      paid: 'Potvrdenie rezervácie | Nitráčik'
    };

    const pType = sessionDetails.paymentType || 'paid';
    const subject = SUBJECTS[pType] || SUBJECTS['paid'];

    // === SEASON TICKET INFO ===
    let seasonTicketRows = '';
    if (pType === 'season_ticket' && sessionDetails.remainingEntries !== undefined) {
      const expiryFormatted = dayjs(sessionDetails.expiryDate).tz('Europe/Bratislava').format('DD.MM.YYYY');
      seasonTicketRows = `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #eab308;">
          <div style="color: #9333ea; font-weight: bold; margin-bottom: 5px;">🎫 Stav permanentky:</div>
          <div class="highlight-item">Použité vstupy teraz: <strong>${sessionDetails.usedEntries}</strong></div>
          <div class="highlight-item">Zostávajúce vstupy: <strong>${sessionDetails.remainingEntries} / ${sessionDetails.totalEntries}</strong></div>
          <div class="highlight-item" style="font-size: 13px; color: #666;">Platnosť do: ${expiryFormatted}</div>
        </div>
      `;
    }

    const mailOptions = {
      from: SENDER,
      to: userEmail,
      subject,
      html: injectImageUrls(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
            .content { padding: 30px; color: #333333; line-height: 1.6; text-align: justify; }
            .highlight-box { background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: left; }
            .highlight-item { margin-bottom: 5px; font-size: 15px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
            p { margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div style="background-color: #f4f4f4; padding: 40px 0;">
            <div class="container">
              <div class="header">
                <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
              </div>
              <div class="content">
                <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: left;">Dobrý deň, ${userName}.</p>
                
                <p>Ďakujem, že si si dopriala zmysluplný čas pre seba. Zaslúžiš si ho!</p>
                
                <div class="highlight-box">
                  <div class="highlight-item">📅 <strong>Dátum:</strong> ${formattedDateString}</div>
                  <div class="highlight-item">⏰ <strong>Čas:</strong> ${sessionDetails.start_time || sessionDetails.time}</div>
                  <div class="highlight-item">📍 <strong>Miesto:</strong> 
                      <a href="https://www.google.com/maps/search/?api=1&query=Štefánikova+trieda+148,+Nitra" 
                        style="color: #2563eb; text-decoration: underline;">
                        Štefánikova trieda 148, Nitra</a>
                  </div>
                  
                  ${seasonTicketRows} 
                  
                </div>

                <p>Teším sa na teba v krásnych priestoroch Nitráčika na Štefánikovej triede 148. Prosím, po vstupe na pozemok pokračuj na vnútorné átrium. Tam nájdeš vchod dnu.</p>
                <p>Parkovať môžeš zadarmo priamo na parkovisku pred budovou alebo zboku v areáli železníc.</p>
                <p>Nič špeciálne si so sebou nemusíš brať. Papučky a drobné občerstvenie budú pripravené.</p>
                <p>Do skorého videnia,</p>
                
                <div style="margin-top: 30px;">
                  <p style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #ef3f3f; margin-bottom: 5px;">Saška</p>
                  <p style="font-size: 14px; margin: 0;"><strong>JUDr. Košičárová Alexandra</strong></p>
                  <p style="font-size: 13px; color: #666; margin: 0;">Štatutárka a zakladateľka O.z. Nitráčik</p>
                  <p style="font-size: 13px; color: #666; margin: 0;">+421 949 584 576</p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; line-height: 1.5;">
                  <p style="margin: 0 0 8px 0;"><strong>Súhlas so začatím poskytovania služby:</strong></p>
                  <p style="margin: 0;">Týmto potvrdzujem, že som pri objednávke udelil/a súhlas so začatím poskytovania služby pred uplynutím lehoty na odstúpenie od zmluvy v zmysle § 7 ods. 1 zákona č. 102/2014 Z.z. o ochrane spotrebiteľa pri predaji tovaru alebo poskytovaní služieb na základe zmluvy uzavretej na diaľku alebo zmluvy uzavretej mimo prevádzkových priestorov predávajúceho a o zmene a doplnení niektorých zákonov. Bol/a som poučený/á o tom, že v prípade uplatnenia tohto súhlasu stratím právo odstúpiť od zmluvy v zmysle § 7 ods. 6 písm. l) uvedeného zákona, ak bude služba v plnom rozsahu poskytnutá.</p>
                </div>
              </div>
              <div class="footer">
                <div style="margin-bottom: 15px;">
                   <a href="https://www.instagram.com/nitracik/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:igIcon" alt="Instagram" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                  <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:fbIcon" alt="Facebook" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                </div>
                <p style="margin: 0;">© 2026 O.z. Nitráčik. Všetky práva vyhradené.</p>
                <p style="margin: 5px 0 0 0;">info@nitracik.sk</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `),
      attachments: getCommonAttachments()
    };
    return transporter.sendMail(mailOptions);
  },

  // 3. Delete account email
  sendAccountDeletedEmail: async (userEmail, userName, userData = {}) => {
    const { activeBookings = [], activeSeasonTickets = [], unusedCredits = [], hasActiveItems = false } = userData;
    
    // Formatter HTML pre zaplatené rezervácie
    let bookingsHTML = '';
    if (activeBookings.length > 0) {
      const bookingsList = activeBookings.map(booking => {
        const bookingDate = new Date(booking.training_date).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' });
        const accompanyingText = booking.accompanying_person ? ' (+1 dospelý)' : '';
        return `<li><strong>${booking.training_type}</strong> - ${bookingDate} (${booking.number_of_children} ${booking.number_of_children === 1 ? 'dieťa' : 'detí'}${accompanyingText})</li>`;
      }).join('');
      
      bookingsHTML = `
        <div style="margin-bottom: 15px;">
          <p style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">📅 Zaplatené rezervácie (${activeBookings.length}):</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
            ${bookingsList}
          </ul>
        </div>
      `;
    }
    
    // Formatter HTML pre permanentky
    let ticketsHTML = '';
    if (activeSeasonTickets.length > 0) {
      const ticketsList = activeSeasonTickets.map(ticket => {
        const expiryDate = new Date(ticket.expiry_date).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' });
        return `<li><strong>${ticket.training_type_name || 'Permanentka'}</strong> - ${ticket.entries_remaining}/${ticket.entries_total} vstupov, Platnosť do: ${expiryDate}</li>`;
      }).join('');
      
      ticketsHTML = `
        <div style="margin-bottom: 15px;">
          <p style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">🎫 Platné permanentky s aktívnymi vstupmi (${activeSeasonTickets.length}):</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
            ${ticketsList}
          </ul>
        </div>
      `;
    }
    
    // Formatter HTML pre kredity
    let creditsHTML = '';
    if (unusedCredits.length > 0) {
      const creditsList = unusedCredits.map(credit => {
        const creditDate = new Date(credit.created_at).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' });
        const accompanyingText = credit.accompanying_person ? ' (+1 dospelý)' : '';
        return `<li><strong>${credit.training_type}</strong> - ${credit.child_count} ${credit.child_count === 1 ? 'dieťa' : 'detí'}${accompanyingText} (vytvorené: ${creditDate})</li>`;
      }).join('');
      
      creditsHTML = `
        <div style="margin-bottom: 15px;">
          <p style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">💳 Nepoužité kredity (${unusedCredits.length}):</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
            ${creditsList}
          </ul>
        </div>
      `;
    }
    
    // Formar finálny HTML pre aktívne items
    let activeItemsHTML = '';
    if (hasActiveItems) {
      activeItemsHTML = `
        <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 25px 0;">
          <p style="font-size: 16px; font-weight: bold; color: #d97706; margin-top: 0;">⚠️ Máte ešte aktívne nevyužité subjekty:</p>
          ${bookingsHTML}
          ${ticketsHTML}
          ${creditsHTML}
          <p style="margin-bottom: 0; font-size: 14px; color: #1f2937;">
            <strong>Dobrá správa:</strong> Podľa našich obchodných podmienok (bod 5.10) máte možnosť tieto subjekty využívať aj po zrušení účtu. 
            Môžete ich využívať na základe dohody s majiteľom. <br/><br/>
            <strong>Kontaktujte nás:</strong><br/>
            📧 <strong>info@nitracik.sk</strong><br/>
            📞 <strong>+421 949 584 576</strong>
          </p>
        </div>
      `;
    }

    const subject = 'Rozlúčka s Nitráčikom - Potvrdenie zrušenia účtu';
    const mailOptions = {
      from: SENDER,
      to: userEmail,
      subject,
      html: injectImageUrls(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #ef4444; }
            .content { padding: 30px; color: #333333; line-height: 1.6; text-align: justify; }
            .highlight-box { background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 20px; margin: 25px 0; text-align: center; font-style: italic; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
            p { margin-bottom: 15px; }
            .quote-en { color: #ef4444; font-weight: bold; font-size: 18px; display: block; margin-bottom: 5px; }
            .quote-sk { color: #555; font-size: 16px; }
            ul { margin: 0; padding-left: 20px; }
            li { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div style="background-color: #f4f4f4; padding: 40px 0;">
            <div class="container">
              <div class="header">
                <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
              </div>
              <div class="content">
                <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: left;">Dobrý deň, ${userName || 'kamarát'}.</p>
                <p>S ľútosťou Vám potvrdzujem, že Váš účet bol na Vašu žiadosť úspešne zrušený a Vaše osobné údaje boli vymazané z nášho systému.</p>
                <p>Hoci sa naše cesty nateraz rozchádzajú, chcem Vám poďakovať, že ste boli súčasťou nášho ufúľaného sveta.</p>
                <p>Mrzí nás, že odchádzate, ale dvere u nás máte vždy otvorené. Kedykoľvek sa na nás v budúcnosti obrátite, radi Vás opäť privítame medzi nami.</p>
                
                ${activeItemsHTML}
                
                <div class="highlight-box">
                   <span class="quote-en">"Sorry about the mess, we're making memories!"</span>
                   <span class="quote-sk">"Prepáčte ten neporiadok, tvorili sme spomienky!"</span>
                </div>
                <div style="margin-top: 30px;">
                  <p style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #ef3f3f; margin-bottom: 5px;">Saška</p>
                  <p style="font-size: 14px; margin: 0;"><strong>JUDr. Košičárová Alexandra</strong></p>
                  <p style="font-size: 13px; color: #666; margin: 0;">Štatutárka a zakladateľka O.z. Nitráčik</p>
                </div>
              </div>
              <div class="footer">
                <div style="margin-bottom: 15px;">
                  <a href="https://www.instagram.com/nitracik/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:igIcon" alt="Instagram" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                  <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:fbIcon" alt="Facebook" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                </div>
                <p style="margin: 0;">© 2026 O.z. Nitráčik.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `),
      attachments: getCommonAttachments()
    };
    return transporter.sendMail(mailOptions);
  },

  // --- 4. USER: SEASON TICKET PURCHASE (STRIPE WEBHOOK) ---
  sendSeasonTicketConfirmation: async (userEmail, userName, { entries, totalPrice, expiryDate, productName, trainingTypeName, stripePaymentId }) => {
    // Naformátujeme dátumy do slovenčiny
    const formattedPurchaseDate = dayjs().tz('Europe/Bratislava').format('DD.MM.YYYY');
    const formattedExpiryDate = dayjs(expiryDate).tz('Europe/Bratislava').format('DD.MM.YYYY');
    const displayProductName = productName || trainingTypeName;

    const subject = 'Potvrdenie nákupu permanentky | Nitráčik';

    const mailOptions = {
      from: SENDER,
      to: userEmail,
      subject,
      html: injectImageUrls(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
            .content { padding: 30px; color: #333333; line-height: 1.6; text-align: justify; }
            .highlight-box { background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 20px; margin: 25px 0; text-align: left; }
            .highlight-item { margin-bottom: 8px; font-size: 15px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
            p { margin-bottom: 15px; }
            .quote-en { color: #d97706; font-weight: bold; font-size: 18px; display: block; margin-bottom: 5px; text-align: center; }
            .quote-sk { color: #555; font-size: 16px; display: block; text-align: center; }
            .quote-box { background-color: #fefce8; border: 1px solid #fde047; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: center; font-style: italic; }
          </style>
        </head>
        <body>
          <div style="background-color: #f4f4f4; padding: 40px 0;">
            <div class="container">
              <div class="header">
                <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
              </div>
              <div class="content">
                <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: left;">Dobrý deň, ${userName}.</p>
                
                <p>Máme obrovskú radosť! Vaša objednávka <strong>permanentky do Nitráčika</strong> bola úspešne potvrdená.</p> 
                ${displayProductName ? `<p>Typ permanentky: <strong>${displayProductName}</strong></p>` : ''}
                ${displayProductName ? `<p style="font-size: 13px; color: #666;">Odteraz ju môžete využiť podľa typu <strong>${displayProductName}</strong>. Permanentka sa vám zobrazí v rezervačnom formulári.</p>` : ''}
                
                <p>Už teraz sa tešíme na všetky Vaše budúce návštevy. S permanentkou máte vstup do nášho farebného sveta ešte jednoduchší.</p>

                <div class="highlight-box">
                   <div class="highlight-item">🎟️ <strong>Počet vstupov:</strong> ${entries}</div>
                   ${displayProductName ? `<div class="highlight-item">🎨 <strong>Typ permanentky:</strong> ${displayProductName}</div>` : ''}
                   <div class="highlight-item">💰 <strong>Cena:</strong> ${totalPrice} €</div>
                   <div class="highlight-item">📅 <strong>Dátum nákupu:</strong> ${formattedPurchaseDate}</div>
                   <div class="highlight-item">⏳ <strong>Platnosť (6 mesiacov):</strong> ${formattedExpiryDate}</div>
                   ${stripePaymentId ? `<div class="highlight-item">🔑 <strong>Stripe Payment ID:</strong> ${stripePaymentId}</div>` : ''}
                </div>

                <div class="quote-box">
                   <span class="quote-en">"Play is the highest form of research."</span>
                   <span class="quote-sk">"Hra je najvyššia forma výskumu."</span>
                </div>

                <div style="margin-top: 30px;">
                  <p style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #ef3f3f; margin-bottom: 5px;">Saška</p>
                  <p style="font-size: 14px; margin: 0;"><strong>JUDr. Košičárová Alexandra</strong></p>
                  <p style="font-size: 13px; color: #666; margin: 0;">Štatutárka a zakladateľka O.z. Nitráčik</p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; line-height: 1.5;">
                  <p style="margin: 0 0 8px 0;"><strong>Súhlas so začatím poskytovania služby:</strong></p>
                  <p style="margin: 0;">Týmto potvrdzujem, že som pri objednávke udelil/a súhlas so začatím poskytovania služby pred uplynutím lehoty na odstúpenie od zmluvy v zmysle § 7 ods. 1 zákona č. 102/2014 Z.z. o ochrane spotrebiteľa pri predaji tovaru alebo poskytovaní služieb na základe zmluvy uzavretej na diaľku alebo zmluvy uzavretej mimo prevádzkových priestorov predávajúceho a o zmene a doplnení niektorých zákonov. Bol/a som poučený/á o tom, že v prípade uplatnenia tohto súhlasu stratím právo odstúpiť od zmluvy v zmysle § 7 ods. 6 písm. l) uvedeného zákona, ak bude služba v plnom rozsahu poskytnutá.</p>
                </div>
              </div>
              <div class="footer">
                <div style="margin-bottom: 15px;">
                  <a href="https://www.instagram.com/nitracik/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:igIcon" alt="Instagram" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                  <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:fbIcon" alt="Facebook" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                </div>
                <p style="margin: 0;">© 2026 O.z. Nitráčik. Všetky práva vyhradené.</p>
                <p style="margin: 5px 0 0 0;">info@nitracik.sk</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `),
      attachments: [
        ...getCommonAttachments(),
        {
          filename: 'Odstupenie_od_zmluvy_nitracik.pdf',
          path: path.resolve(__dirname, '..', 'public', 'documents', 'Odstupenie_od_zmluvy_nitracik.pdf')
        }
      ]
    };
    return transporter.sendMail(mailOptions);
  },

  // --- 4b. ADMIN: SEASON TICKET PURCHASE NOTIFICATION ---
  sendAdminSeasonTicketPurchase: async (adminEmail, data) => {
    const formattedPurchaseDate = dayjs().tz('Europe/Bratislava').format('DD.MM.YYYY');
    const formattedExpiryDate = dayjs(data.expiryDate).tz('Europe/Bratislava').format('DD.MM.YYYY');

    const mailOptions = {
      from: SENDER,
      to: adminEmail,
      subject: 'Nový nákup permanentky - Nitráčik',
      html: injectImageUrls(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
             body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: sans-serif; }
             .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
             .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
             .content { padding: 30px; color: #333; }
             .info-box { background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
             .info-row { margin-bottom: 12px; font-size: 15px; }
             .info-label { font-weight: bold; color: #1f2937; }
             .divider { border: 0; border-top: 1px solid #d1d5db; margin: 15px 0; }
             .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div style="background-color: #f4f4f4; padding: 40px 0;">
            <div class="container">
              <div class="header">
                 <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
              </div>
              <div class="content">
                <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #9333ea;">🎫 Nový nákup permanentky!</p>
                
                <div class="info-box">
                  <p style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #2563eb;">Informácie o užívateľovi</p>
                  <div class="info-row"><span class="info-label">👤 Meno:</span> ${data.user.first_name} ${data.user.last_name}</div>
                  <div class="info-row"><span class="info-label">📧 Email:</span> <a href="mailto:${data.user.email}" style="color: #2563eb;">${data.user.email}</a></div>
                  <div class="info-row"><span class="info-label">📍 Adresa:</span> ${data.user.address}</div>
                  
                  <hr class="divider">
                  
                  <p style="font-size: 16px; font-weight: bold; margin-bottom: 15px; margin-top: 20px; color: #2563eb;">Detaily permanentky</p>
                  <div class="info-row"><span class="info-label">🎟️ Počet vstupov:</span> ${data.entries}</div>
                  ${(data.productName || data.trainingTypeName) ? `<div class="info-row"><span class="info-label">🎨 Typ permanentky:</span> ${data.productName || data.trainingTypeName}</div>` : ''}
                  <div class="info-row"><span class="info-label">💰 Cena:</span> ${data.totalPrice} €</div>
                  <div class="info-row"><span class="info-label">📅 Dátum nákupu:</span> ${formattedPurchaseDate}</div>
                  <div class="info-row"><span class="info-label">⏳ Platnosť do:</span> ${formattedExpiryDate}</div>
                  
                  <hr class="divider">
                  
                  <div class="info-row">
                    <span class="info-label">🔑 Stripe Payment ID:</span> <span style="font-size: 12px; color: #6b7280;">${data.stripePaymentId || 'N/A'}</span>
                  </div>
                  
                  <hr class="divider">
                  
                  <div class="info-row" style="background-color: #fef3c7; padding: 12px; border-radius: 6px; margin-top: 15px;">
                    <span style="font-size: 13px; color: #92400e;">✅ Zákazník pri objednávke zaškrtol súhlas so začatím poskytovania služby pred uplynutím lehoty na odstúpenie a bol poučený o strate práva na odstúpenie.</span>
                  </div>
                </div>

              </div>
              <div class="footer">
                <p>© 2026 O.z. Nitráčik.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `),
      attachments: getCommonAttachments()
    };
    return transporter.sendMail(mailOptions);
  },

  // --- 5. ADMIN: NEW BOOKING NOTIFICATION (STANDARD) ---
  sendAdminNewBookingNotification: async (adminEmail, data) => {
    const formatBool = (val) => (val === true || val === 'true' ? 'Áno' : 'Nie');

    // Získame tabuľku (trainingId musíš poslať z controllera)
    const attendeesData = await getAttendeesList(data.trainingId);

    const mailOptions = {
      from: SENDER,
      to: adminEmail,
      subject: data.paymentType === 'gift_card' 
        ? 'Nová rezervácia - Nitráčik (Darčekový poukaz 🎁)' 
        : 'Nová rezervácia - Nitráčik (Platba)',
      html: injectImageUrls(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
            .content { padding: 30px; color: #333333; line-height: 1.6; }
            .info-box { background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .info-row { margin-bottom: 12px; font-size: 15px; }
            .info-label { font-weight: bold; color: #1f2937; }
            .divider { border: 0; border-top: 1px solid #d1d5db; margin: 15px 0; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div style="background-color: #f4f4f4; padding: 40px 0;">
            <div class="container">
              <div class="header">
                 <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
              </div>
              <div class="content">
                <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #16a34a;">${data.paymentType === 'gift_card' ? '🎁 Nová rezervácia (Darčekový poukaz)!' : '🎉 Nová rezervácia (Platba kartou)!'}</p>
                
                <div class="info-box">
                  <p style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #2563eb;">Informácie o užívateľovi</p>
                  <div class="info-row"><span class="info-label">👤 Meno:</span> ${data.user.first_name} ${data.user.last_name}</div>
                  <div class="info-row"><span class="info-label">📧 Email:</span> <a href="mailto:${data.user.email}" style="color: #2563eb;">${data.user.email}</a></div>
                  <div class="info-row"><span class="info-label">📍 Adresa:</span> ${data.user.address}</div>
                  <div class="info-row"><span class="info-label">📱 Mobil:</span> ${data.mobile || 'Neuvedené'}</div>
                  
                  <hr class="divider">
                  
                  <p style="font-size: 16px; font-weight: bold; margin-bottom: 15px; margin-top: 20px; color: #2563eb;">Detaily rezervácie</p>
                  <div class="info-row"><span class="info-label">👶 Počet detí:</span> ${data.childrenCount}</div>
                  <div class="info-row"><span class="info-label">🎂 Vek detí:</span> ${data.childrenAge}</div>
                  <div class="info-row"><span class="info-label">🎨 Typ tréningu:</span> ${data.trainingType}</div>
                  <div class="info-row"><span class="info-label">📅 Dátum:</span> ${data.selectedDate}</div>
                  <div class="info-row"><span class="info-label">⏰ Čas:</span> ${data.selectedTime}</div>
                  
                  <hr class="divider">

                  <div class="info-row"><span class="info-label">📸 Foto súhlas:</span> ${formatBool(data.photoConsent)}</div>
                  <div class="info-row"><span class="info-label">👥 Sprievod:</span> ${formatBool(data.accompanyingPerson)}</div>
                  <div class="info-row"><span class="info-label">📝 Poznámky:</span> ${data.note || 'Žiadne'}</div>

                  <hr class="divider">
                  
                  <div class="info-row" style="margin-top: 20px;">
                    <span class="info-label" style="font-size: 16px; color: #16a34a;">💰 Cena:</span> 
                    <span style="font-size: 16px; font-weight: bold; color: #16a34a;">${data.totalPrice} €</span>
                  </div>
                  ${data.paymentType === 'gift_card' ? `
                  <div class="info-row" style="background-color: #fffbeb; padding: 10px; border-radius: 6px; border-left: 3px solid #f59e0b;">
                    <span class="info-label">🎁 Spôsob platby:</span> Darčekový poukaz<br/>
                    <span class="info-label">💳 Kód poukazu:</span> <span style="font-family: monospace; font-weight: bold;">${data.giftCardCode || ''}</span><br/>
                    <span class="info-label">📊 Zostatok na poukaze:</span> ${data.giftCardBalance !== undefined ? Number(data.giftCardBalance).toFixed(2) + ' €' : 'N/A'}
                  </div>
                  ` : `
                  <div class="info-row">
                    <span class="info-label">🔑 Payment Intent:</span> <span style="font-size: 12px; color: #6b7280;">${data.paymentIntentId || ''}</span>
                  </div>
                  `}
                  
                  <hr class="divider">
                  
                  <div class="info-row" style="background-color: #fef3c7; padding: 12px; border-radius: 6px; margin-top: 15px;">
                    <span style="font-size: 13px; color: #92400e;">✅ Zákazník pri objednávke zaškrtol súhlas so začatím poskytovania služby pred uplynutím lehoty na odstúpenie a bol poučený o strate práva na odstúpenie.</span>
                  </div>
                </div>

                ${attendeesData.html}

              </div>
              <div class="footer">
                <p>© 2026 O.z. Nitráčik.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `),
      attachments: getCommonAttachments()
    };
    return transporter.sendMail(mailOptions);
  },

  // --- 6. ADMIN: SEASON TICKET USE NOTIFICATION ---
  sendAdminSeasonTicketUsage: async (adminEmail, data) => {
    // 1. Získame tabuľku účastníkov
    const attendeesData = await getAttendeesList(data.trainingId);

    // === TÉMA ===
    let themeRow = '';
    if (data.theme) {
      themeRow = `
        <div class="info-row"><span class="info-label">🎨 Téma:</span> ${data.theme}</div>
      `;
    }
    // =============

    const mailOptions = {
      from: SENDER,
      to: adminEmail,
      subject: 'Nová rezervácia - Nitráčik (Permanentka)',
      html: injectImageUrls(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
             body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: sans-serif; }
             .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
             .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
             .content { padding: 30px; color: #333; }
             .info-box { background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
             .info-row { margin-bottom: 12px; font-size: 15px; }
             .info-label { font-weight: bold; color: #1f2937; }
             .divider { border: 0; border-top: 1px solid #d1d5db; margin: 15px 0; }
             .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div style="background-color: #f4f4f4; padding: 40px 0;">
            <div class="container">
              <div class="header">
                 <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
              </div>
              <div class="content">
                <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #9333ea;">🎫 Nová rezervácia (Permanentka)!</p>
                
                <div class="info-box">
                  <p style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #2563eb;">Informácie o užívateľovi</p>
                  <div class="info-row"><span class="info-label">👤 Meno:</span> ${data.user.first_name} ${data.user.last_name}</div>
                  <div class="info-row"><span class="info-label">📧 Email:</span> <a href="mailto:${data.user.email}" style="color: #2563eb;">${data.user.email}</a></div>
                  <div class="info-row"><span class="info-label">📍 Adresa:</span> ${data.user.address}</div>
                  <div class="info-row"><span class="info-label">📱 Mobil:</span> ${data.mobile || 'Neuvedené'}</div>
                  
                  <hr class="divider">
                  
                  <p style="font-size: 16px; font-weight: bold; margin-bottom: 15px; margin-top: 20px; color: #2563eb;">Detaily rezervácie</p>
                  <div class="info-row"><span class="info-label">👶 Počet detí:</span> ${data.childrenCount}</div>
                  <div class="info-row"><span class="info-label">🎂 Vek detí:</span> ${data.childrenAge}</div>
                  <div class="info-row"><span class="info-label">🎨 Typ tréningu:</span> ${data.trainingType}</div>
                  ${themeRow}
                  <div class="info-row"><span class="info-label">📅 Dátum:</span> ${data.selectedDate}</div>
                  <div class="info-row"><span class="info-label">⏰ Čas:</span> ${data.selectedTime}</div>
                  
                  <hr class="divider">

                  <div class="info-row"><span class="info-label">📸 Foto súhlas:</span> ${data.photoConsent ? 'Áno' : 'Nie'}</div>
                  <div class="info-row"><span class="info-label">📝 Poznámky:</span> ${data.note || 'Žiadne'}</div>

                  <hr class="divider">
                  
                  <div class="info-row" style="margin-top: 20px;">
                    <span class="info-label" style="font-size: 16px; color: #9333ea;">🎫 Permanentka ID:</span> 
                    <span style="font-size: 16px; font-weight: bold;">${data.seasonTicketId}</span>
                  </div>
                </div>

                ${attendeesData.html}

              </div>
              <div class="footer">
                <p>© 2026 O.z. Nitráčik.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `),
      attachments: getCommonAttachments()
    };
    return transporter.sendMail(mailOptions);
  },

  // --- 7. ADMIN: CREDIT USAGE NOTIFICATION ---
  sendAdminCreditUsage: async (adminEmail, data) => {
    // DÔLEŽITÉ: Uisti sa, že posielaš trainingId (niekde v objekte 'data')
    const trainingId = data.trainingId || (data.training && data.training.id);
    const attendeesData = await getAttendeesList(trainingId);

    // Formátovanie dátumu (lokalny cas)
    const dateStr = dayjs(data.training.training_date).tz('Europe/Bratislava').format('D. M. YYYY HH:mm');
    
    // === TÉMA ===
    let themeRow = '';
    if (data.theme) {
      themeRow = `
        <div class="info-row"><span class="info-label">🎨 Téma:</span> ${data.theme}</div>
      `;
    }
    // =============
    
    const mailOptions = {
      from: SENDER,
      to: adminEmail,
      subject: 'Nová rezervácia - Nitráčik (Kredit)',
      html: injectImageUrls(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
             body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: sans-serif; }
             .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
             .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
             .content { padding: 30px; color: #333; }
             .info-box { background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
             .info-row { margin-bottom: 12px; font-size: 15px; }
             .info-label { font-weight: bold; color: #1f2937; }
             .divider { border: 0; border-top: 1px solid #d1d5db; margin: 15px 0; }
             .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div style="background-color: #f4f4f4; padding: 40px 0;">
            <div class="container">
              <div class="header">
                 <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
              </div>
              <div class="content">
                <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #f59e0b;">🪙 Nová rezervácia (Kredit)!</p>
                
                <div class="info-box">
                  <p style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #2563eb;">Informácie o užívateľovi</p>
                  <div class="info-row"><span class="info-label">👤 Meno:</span> ${data.user.first_name} ${data.user.last_name}</div>
                  <div class="info-row"><span class="info-label">📧 Email:</span> <a href="mailto:${data.user.email}" style="color: #2563eb;">${data.user.email}</a></div>
                  
                  <hr class="divider">
                  
                  <p style="font-size: 16px; font-weight: bold; margin-bottom: 15px; margin-top: 20px; color: #2563eb;">Detaily rezervácie</p>
                  <div class="info-row"><span class="info-label">🎨 Typ tréningu:</span> ${data.training.training_type}</div>
                  ${themeRow}
                  <div class="info-row"><span class="info-label">📅 Dátum a čas:</span> ${dateStr}</div>
                  <div class="info-row"><span class="info-label">👶 Počet detí:</span> ${data.credit.child_count}</div>
                  <div class="info-row"><span class="info-label">🎂 Vek detí:</span> ${data.finalChildrenAges}</div>
                  <div class="info-row"><span class="info-label">📱 Mobil:</span> ${data.finalMobile}</div>
                  
                  <hr class="divider">

                  <div class="info-row"><span class="info-label">📸 Foto súhlas:</span> ${data.finalPhotoConsent ? 'Áno' : 'Nie'}</div>
                  <div class="info-row"><span class="info-label">📝 Poznámky:</span> ${data.finalNote || 'Žiadne'}</div>

                  <hr class="divider">
                  
                  <div class="info-row" style="margin-top: 20px;">
                    <span class="info-label" style="font-size: 14px; color: #f59e0b;">🆔 Booking ID:</span> ${data.bookingId} <br>
                    <span class="info-label" style="font-size: 14px; color: #f59e0b;">💳 Credit ID:</span> ${data.creditId}
                  </div>
                   ${data.originalSessionId ? `<div class="info-row" style="font-size: 12px; color: #6b7280; margin-top:5px;">(Pôvodná zrušená hodina vyčistená: ${data.originalSessionId})</div>` : ''}
                </div>

                ${attendeesData.html}

              </div>
              <div class="footer">
                <p>© 2026 O.z. Nitráčik.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `),
      attachments: getCommonAttachments()
    };
    return transporter.sendMail(mailOptions);
  },

 // --- 8. CANCELLATION (SINGLE) - ADMIN & USER ---
sendCancellationEmails: async (adminEmail, userEmail, booking, refundData, usageResult) => {

    // --- 1. LOGIKA TYPU STORNA ---
    const isPass = booking.booking_type === 'season_ticket'; 
    const isCredit = booking.booking_type === 'credit';
    
    // --- 2. Určenie textov pre ADMINA ---
    let cancellationType = 'NEURČENÉ';
    let typeColor = '#333';
    
    if (refundData && refundData.id) {
        cancellationType = 'REFUND (Vrátenie na kartu)';
        typeColor = '#dc2626';
    } else if (refundData && refundData.error) {
        cancellationType = 'CHYBA REFUNDU (Manuálna kontrola nutná)';
        typeColor = '#ef4444'; 
    } else {
        if (isPass) {
            cancellationType = 'PERMANENTKA (Vrátenie vstupu)';
            typeColor = '#d97706';
        } else if (isCredit) {
            cancellationType = 'KREDIT (Vrátenie na interný účet)';
            typeColor = '#2563eb';
        } else {
            cancellationType = 'INTERNÝ REFUND (Rezervvácia --> kredit)';
            typeColor = '#2563eb';
        }
    }

    const attendeesData = await getAttendeesList(booking.training_id);
    const dateStr = dayjs(booking.training_date).tz('Europe/Bratislava').format('D. M. YYYY HH:mm');

    // --- SPOLOČNÝ FOOTER HTML (Aby sme to nepísali 2x) ---
    const footerHtml = `
        <div class="footer">
            <div style="margin-bottom: 15px;">
              <a href="https://www.instagram.com/nitracik/" style="text-decoration: none; margin: 0 10px;">
                <img src="cid:igIcon" alt="Instagram" style="width: 28px; height: 28px; vertical-align: middle;"/>
              </a>
              <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="text-decoration: none; margin: 0 10px;">
                <img src="cid:fbIcon" alt="Facebook" style="width: 28px; height: 28px; vertical-align: middle;"/>
              </a>
            </div>
            <p style="margin: 0;">© 2026 O.z. Nitráčik. Všetky práva vyhradené.</p>
            <p style="margin: 5px 0 0 0;">info@nitracik.sk</p>
        </div>
    `;

    // --- 3. ADMIN EMAIL HTML ---
    const adminHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #dc2626; }
            .content { padding: 30px; color: #333333; line-height: 1.6; }
            .info-box { background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .info-row { margin-bottom: 12px; font-size: 15px; }
            .info-label { font-weight: bold; color: #1f2937; }
            .divider { border: 0; border-top: 1px solid #d1d5db; margin: 15px 0; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div style="background-color: #f4f4f4; padding: 40px 0;">
            <div class="container">
              <div class="header">
                 <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
              </div>
              <div class="content">
                <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #dc2626;">❌ Zrušenie rezervácie užívateľom</p>
                
                <div class="info-box">
                  <p style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">Informácie o užívateľovi</p>
                  <div class="info-row"><span class="info-label">👤 Meno:</span> ${booking.first_name} ${booking.last_name}</div>
                  <div class="info-row"><span class="info-label">📧 Email:</span> <a href="mailto:${booking.email}" style="color: #2563eb;">${booking.email}</a></div>
                  
                  <hr class="divider">
                  
                  <p style="font-size: 16px; font-weight: bold; margin-bottom: 15px; margin-top: 20px; color: #1f2937;">Detaily zrušenej rezervácie</p>
                  <div class="info-row"><span class="info-label">🎨 Typ tréningu:</span> ${booking.training_type}</div>
                  <div class="info-row"><span class="info-label">📅 Dátum:</span> ${dateStr}</div>
                  <div class="info-row"><span class="info-label">👶 Počet detí:</span> ${booking.number_of_children}</div>
                  
                  <hr class="divider">

                  <div class="info-row"><span class="info-label">ℹ️ Typ zrušenia:</span> <span style="color: ${typeColor}; font-weight: bold;">${cancellationType}</span></div>
                  <div class="info-row"><span class="info-label">💰 Suma/Hodnota:</span> ${booking.amount_paid} €</div>
                  
                  ${refundData && refundData.id ? `<div class="info-row"><span class="info-label">🔑 Refund ID:</span> <span style="font-size: 12px; color: #6b7280;">${refundData.id}</span></div>` : ''}
                </div>

                ${attendeesData.html}

              </div>
              
              ${footerHtml}

            </div>
          </div>
        </body>
        </html>
    `;

    // --- 4. USER EMAIL LOGIC ---
    let userRefundText = '';
    
    if (refundData && refundData.id) {
        // A. REFUND NA KARTU
        userRefundText = `
            <strong>Informácia o vrátení platby:</strong><br><br>
            - Suma: <strong>${booking.amount_paid} €</strong><br>
            - Stav: Odoslané na spracovanie<br>
            - ID Transakcie: <span style="font-family:monospace; color:#666;">${refundData.id}</span><br><br>
            <span style="font-size:13px;">Peniaze by sa mali vrátiť na váš účet do 5-10 pracovných dní.</span>
        `;
    } else if (refundData && refundData.error) {
        // B. CHYBA
        userRefundText = `<strong>Stav vrátenia:</strong> Nepodarilo sa automaticky vrátiť platbu na kartu. Kontaktujte nás prosím, vyriešime to manuálne.`;
    } else {
        // C. INTERNÝ REFUND
        if (isPass) {
             userRefundText = `
                <strong>Vrátenie vstupu:</strong><br>
                Váš vstup na permanentku bol úspešne vrátený. Môžete ho použiť na ďalšiu rezerváciu.
             `;
        } else {
             const creditCompatibilityNotice = getMiniMidiMaxiCreditNoticeHtml(booking.training_type);
             userRefundText = `
                <strong>Vrátenie kreditu:</strong><br>
                Kredit v hodnote tréningu bol vrátený na váš účet v Nitráčiku.
               ${creditCompatibilityNotice}
             `;
        }
    }

    const userHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: sans-serif; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #dc2626; }
            .content { padding: 30px; color: #333; line-height: 1.6; }
            .info-box { background-color: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div style="background-color: #f4f4f4; padding: 40px 0;">
            <div class="container">
              <div class="header">
                 <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
              </div>
              <div class="content">
                <p style="font-size: 18px; font-weight: bold;">Dobrý deň, ${booking.first_name}.</p>
                <p>Vaša rezervácia na tréning <strong>${booking.training_type}</strong> (Dátum: ${dateStr}) bola úspešne zrušená.</p>
                
                <div class="info-box">
                   ${userRefundText}
                </div>
                
                <p>Dúfame, že sa uvidíme nabudúce.</p>
                <p>S pozdravom,<br>Tím Nitráčik</p>
              </div>
              
              ${footerHtml}
              
            </div>
          </div>
        </body>
        </html>
    `;

    return Promise.all([
        // Admin email
        transporter.sendMail({
            from: SENDER,
            to: adminEmail,
            subject: `❌ Zrušená rezervácia: ${booking.first_name} ${booking.last_name}`,
        html: injectImageUrls(adminHtml),
            attachments: getCommonAttachments() 
        }),
        // User email
        transporter.sendMail({
            from: SENDER,
            to: userEmail,
            subject: 'Potvrdenie zrušenia rezervácie | Nitráčik',
        html: injectImageUrls(userHtml),
            attachments: getCommonAttachments()
        })
    ]);
},

  // --- 9. MASS CANCELLATION (PLATBA KARTOU - VÝBER) ---
  sendMassCancellationEmail: async (userEmail, booking, reason, frontendUrl) => {
    // Dátum formátovanie
    const dateObj = new Date(booking.training_date || booking.trainingDate);
    // Formát dátumu podľa dizajnu rezervácie (napr. 30.01.2026 (piatok))
    const datePart = dateObj.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const dayPart = dateObj.toLocaleDateString('sk-SK', { weekday: 'long' });
    const timePart = dateObj.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

    const formattedDateString = `${datePart} (${dayPart})`;

    // Linky na refund
    const refundUrl = `${frontendUrl}/refund-option?bookingId=${booking.booking_id}&action=refund`;
    const creditUrl = `${frontendUrl}/credit-option?bookingId=${booking.booking_id}`;

    const childrenCount = booking.number_of_children || 1;
    const trainingType = booking.training_type || booking.trainingType;
    const userName = booking.first_name || 'Osôbka';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
          .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
          .content { padding: 30px; color: #333333; line-height: 1.6; text-align: justify; }
          
          /* Box pre zrušenie - červený nádych */
          .alert-box { background-color: #fef2f2; border: 1px solid #f87171; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: left; }
          .alert-item { margin-bottom: 5px; font-size: 15px; }
          
          /* Boxy pre možnosti */
          .option-container { margin-top: 25px; }
          .option-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: #fafafa; }
          .option-title { font-weight: bold; display: block; margin-bottom: 8px; font-size: 16px; }
          .btn { display: inline-block; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px; font-size: 14px; text-align: center; }
          
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          p { margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div style="background-color: #f4f4f4; padding: 40px 0;">
          <div class="container">
            <div class="header">
              <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
            </div>

            <div class="content">
              <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: left;">Dobrý deň, ${userName}.</p>
              
              <p>S poľutovaním Vám oznamujeme, že Váš plánovaný tréning bol zrušený.</p>

              <div class="alert-box">
                <div class="alert-item" style="color: #dc2626; font-weight: bold; margin-bottom: 10px;">⚠️ ZRUŠENIE REZERVÁCIE</div>
                <div class="alert-item">🗓️ <strong>Dátum:</strong> ${formattedDateString}</div>
                <div class="alert-item">⏰ <strong>Čas:</strong> ${timePart}</div>
                <div class="alert-item">🧘 <strong>Tréning:</strong> ${trainingType}</div>
                <div class="alert-item" style="margin-top: 10px; border-top: 1px dashed #fca5a5; padding-top: 10px;">
                  <strong>Dôvod:</strong> ${reason || 'Prevádzkové dôvody'}
                </div>
              </div>

              <p>Keďže ste za tréning zaplatili kartou, pripravili sme pre Vás dve možnosti kompenzácie. Vyberte si prosím tú, ktorá Vám viac vyhovuje:</p>

              <div class="option-container">
                <div class="option-box" style="border-left: 4px solid #10b981; background-color: #ecfdf5;">
                  <span class="option-title" style="color: #059669;">🎫 Pripísanie kreditu (Odporúčané)</span>
                  <p style="font-size: 14px; margin: 0 0 10px 0;">
                    Pohodlnejšie riešenie bez čakania. Hodnota tréningu Vám bude okamžite pripísaná ako <strong>kredit</strong> do Vášho profilu (Typ: ${trainingType}, Deti: ${childrenCount}).
                    ${isMiniMidiMaxiType(trainingType)
                      ? 'Tento kredit môžete využiť na hodiny MINI, MIDI alebo MAXI.'
                      : 'Kredit následne použijete na ďalší termín rovnakého typu tréningu.'}
                  </p>
                  <div style="text-align: right;">
                    <a href="${creditUrl}" class="btn" style="background-color: #10b981; color: white;">Pripísať ako kredit</a>
                  </div>
                </div>

                <div class="option-box" style="border-left: 4px solid #ef4444; background-color: #fff;">
                  <span class="option-title" style="color: #dc2626;">💳 Vrátenie peňazí (Refund)</span>
                  <p style="font-size: 14px; margin: 0 0 10px 0;">
                    Po kliknutí prebehne automatická požiadavka cez systém Stripe. Vrátenie peňazí na Váš bankový účet zvyčajne trvá <strong>5 až 10 pracovných dní</strong> v závislosti od banky.
                  </p>
                  <div style="text-align: right;">
                    <a href="${refundUrl}" class="btn" style="background-color: #ef4444; color: white;">Vrátiť peniaze na kartu</a>
                  </div>
                </div>
              </div>

              <p>Ospravedlňujeme sa za komplikácie a tešíme sa na Vás v náhradnom termíne.</p>

              <div style="margin-top: 30px;">
                <p style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #ef3f3f; margin-bottom: 5px;">Saška</p>
                <p style="font-size: 14px; margin: 0;"><strong>JUDr. Košičárová Alexandra</strong></p>
                <p style="font-size: 13px; color: #666; margin: 0;">Štatutárka a zakladateľka O.z. Nitráčik</p>
                <p style="font-size: 13px; color: #666; margin: 0;">+421 949 584 576</p>
              </div>
            </div>

            <div class="footer">
              <div style="margin-bottom: 15px;">
                  <a href="https://www.instagram.com/nitracik/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:igIcon" alt="Instagram" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                  <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:fbIcon" alt="Facebook" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
              </div>
              <p style="margin: 0;">© 2026 O.z. Nitráčik. Všetky práva vyhradené.</p>
              <p style="margin: 5px 0 0 0;">info@nitracik.sk</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    // Odoslanie emailu s prílohami (logo, ikonky)
    return transporter.sendMail({
      from: SENDER,
      to: userEmail,
      subject: `ZRUŠENÉ: ${trainingType} (${formattedDateString})`,
      html: injectImageUrls(html),
      attachments: getCommonAttachments() // Dôležité pre fungovanie cid: obrázkov
    });
  },

 // --- 9a. MASS CANCELLATION (PERMANENTKA - AUTOMATICKY) ---
sendMassCancellationSeasonTicket: async (userEmail, firstName, trainingType, dateObj, reason) => {
    // Formátovanie dátumu a času
    const d = new Date(dateObj);
    const datePart = d.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const dayPart = d.toLocaleDateString('sk-SK', { weekday: 'long' });
    const timePart = d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    const formattedDateString = `${datePart} (${dayPart})`;

    const userName = firstName || 'Osôbka';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
          .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
          .content { padding: 30px; color: #333333; line-height: 1.6; text-align: justify; }
          
          /* Box pre zrušenie */
          .alert-box { background-color: #fef2f2; border: 1px solid #f87171; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: left; }
          .alert-item { margin-bottom: 5px; font-size: 15px; }

          /* Box pre potvrdenie vrátenia (Zelený pre permanentku) */
          .success-box { background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: left; }

          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          p { margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div style="background-color: #f4f4f4; padding: 40px 0;">
          <div class="container">
            <div class="header">
              <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
            </div>

            <div class="content">
              <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: left;">Dobrý deň, ${userName}.</p>
              
              <p>S poľutovaním Vám oznamujeme, že Váš plánovaný tréning bol zrušený.</p>

              <div class="alert-box">
                <div class="alert-item" style="color: #dc2626; font-weight: bold; margin-bottom: 10px;">⚠️ ZRUŠENIE REZERVÁCIE</div>
                <div class="alert-item">🗓️ <strong>Dátum:</strong> ${formattedDateString}</div>
                <div class="alert-item">⏰ <strong>Čas:</strong> ${timePart}</div>
                <div class="alert-item">🧘 <strong>Tréning:</strong> ${trainingType}</div>
                <div class="alert-item" style="margin-top: 10px; border-top: 1px dashed #fca5a5; padding-top: 10px;">
                  <strong>Dôvod:</strong> ${reason || 'Prevádzkové dôvody'}
                </div>
              </div>

              <div class="success-box">
                <div style="color: #047857; font-weight: bold; margin-bottom: 5px;">✅ Automatické vrátenie vstupov</div>
                <p style="margin: 0; font-size: 14px; color: #064e3b;">
                   Vaše vstupy boli automaticky vrátené na Vašu permanentku. Nemusíte robiť nič ďalšie, vstupy môžete ihneď použiť na novú rezerváciu.
                </p>
              </div>

              <p>Ospravedlňujeme sa za komplikácie a tešíme sa na Vás v náhradnom termíne.</p>

              <div style="margin-top: 30px;">
                <p style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #ef3f3f; margin-bottom: 5px;">Saška</p>
                <p style="font-size: 14px; margin: 0;"><strong>JUDr. Košičárová Alexandra</strong></p>
                <p style="font-size: 13px; color: #666; margin: 0;">Štatutárka a zakladateľka O.z. Nitráčik</p>
                <p style="font-size: 13px; color: #666; margin: 0;">+421 949 584 576</p>
              </div>
            </div>

            <div class="footer">
              <div style="margin-bottom: 15px;">
                  <a href="https://www.instagram.com/nitracik/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:igIcon" alt="Instagram" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                  <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:fbIcon" alt="Facebook" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
              </div>
              <p style="margin: 0;">© 2026 O.z. Nitráčik. Všetky práva vyhradené.</p>
              <p style="margin: 5px 0 0 0;">info@nitracik.sk</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return transporter.sendMail({
      from: SENDER,
      to: userEmail,
      subject: `ZRUŠENÉ: ${trainingType} (${formattedDateString})`,
      html: injectImageUrls(html),
      attachments: getCommonAttachments()
    });
},

// --- 9b. MASS CANCELLATION (KREDIT - AUTOMATICKY) ---
sendMassCancellationCredit: async (userEmail, firstName, trainingType, dateObj, reason) => {
    // Formátovanie dátumu a času
    const d = new Date(dateObj);
    const datePart = d.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const dayPart = d.toLocaleDateString('sk-SK', { weekday: 'long' });
    const timePart = d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    const formattedDateString = `${datePart} (${dayPart})`;

    const userName = firstName || 'Osôbka';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
          .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
          .content { padding: 30px; color: #333333; line-height: 1.6; text-align: justify; }
          
          /* Box pre zrušenie */
          .alert-box { background-color: #fef2f2; border: 1px solid #f87171; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: left; }
          .alert-item { margin-bottom: 5px; font-size: 15px; }

          /* Box pre potvrdenie vrátenia (Žltý pre kredit) */
          .success-box { background-color: #fffbeb; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: left; }

          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          p { margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div style="background-color: #f4f4f4; padding: 40px 0;">
          <div class="container">
            <div class="header">
              <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
            </div>

            <div class="content">
              <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: left;">Dobrý deň, ${userName}.</p>
              
              <p>S poľutovaním Vám oznamujeme, že Váš plánovaný tréning bol zrušený.</p>

              <div class="alert-box">
                <div class="alert-item" style="color: #dc2626; font-weight: bold; margin-bottom: 10px;">⚠️ ZRUŠENIE REZERVÁCIE</div>
                <div class="alert-item">🗓️ <strong>Dátum:</strong> ${formattedDateString}</div>
                <div class="alert-item">⏰ <strong>Čas:</strong> ${timePart}</div>
                <div class="alert-item">🧘 <strong>Tréning:</strong> ${trainingType}</div>
                <div class="alert-item" style="margin-top: 10px; border-top: 1px dashed #fca5a5; padding-top: 10px;">
                  <strong>Dôvod:</strong> ${reason || 'Prevádzkové dôvody'}
                </div>
              </div>

              <div class="success-box">
                <div style="color: #b45309; font-weight: bold; margin-bottom: 5px;">🎫 Automatické vrátenie kreditu</div>
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                   Použitý kredit bol automaticky vrátený na Váš účet. Nemusíte robiť nič ďalšie, kredit môžete ihneď použiť na novú rezerváciu.
                   ${isMiniMidiMaxiType(trainingType) ? 'Tento kredit môžete využiť na hodiny MINI, MIDI alebo MAXI.' : ''}
                </p>
              </div>

              <p>Ospravedlňujeme sa za komplikácie a tešíme sa na Vás v náhradnom termíne.</p>

              <div style="margin-top: 30px;">
                <p style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #ef3f3f; margin-bottom: 5px;">Saška</p>
                <p style="font-size: 14px; margin: 0;"><strong>JUDr. Košičárová Alexandra</strong></p>
                <p style="font-size: 13px; color: #666; margin: 0;">Štatutárka a zakladateľka O.z. Nitráčik</p>
                <p style="font-size: 13px; color: #666; margin: 0;">+421 949 584 576</p>
              </div>
            </div>

            <div class="footer">
              <div style="margin-bottom: 15px;">
                  <a href="https://www.instagram.com/nitracik/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:igIcon" alt="Instagram" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                  <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:fbIcon" alt="Facebook" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
              </div>
              <p style="margin: 0;">© 2026 O.z. Nitráčik. Všetky práva vyhradené.</p>
              <p style="margin: 5px 0 0 0;">info@nitracik.sk</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return transporter.sendMail({
      from: SENDER,
      to: userEmail,
      subject: `ZRUŠENÉ: ${trainingType} (${formattedDateString})`,
      html: injectImageUrls(html),
      attachments: getCommonAttachments()
    });
},

  // --- 10. CONTACT FORM ---
  sendContactFormEmails: async (adminEmail, { name, email, message }) => {
    // Admin Email
    const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
          .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
          .content { padding: 30px; color: #333333; line-height: 1.6; }
          .info-box { background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .message-box { background-color: #ffffff; padding: 15px; border-radius: 4px; border: 1px solid #d1d5db; margin-top: 15px; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          p { margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div style="background-color: #f4f4f4; padding: 40px 0;">
          <div class="container">
            <div class="header">
              <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
            </div>
            <div class="content">
              <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">Nová správa z kontaktného formulára</p>
              <div class="info-box">
                <p><strong>Meno:</strong> ${name}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></p>
                <hr style="border: 0; border-top: 1px solid #d1d5db; margin: 15px 0;">
                <p><strong>Správa:</strong></p>
                <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
            <div class="footer">
              <div style="margin-bottom: 15px;">
                <a href="https://www.instagram.com/nitracik/" style="text-decoration: none; margin: 0 10px;">
                  <img src="cid:igIcon" alt="Instagram" style="width: 28px; height: 28px; vertical-align: middle;"/>
                </a>
                <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="text-decoration: none; margin: 0 10px;">
                  <img src="cid:fbIcon" alt="Facebook" style="width: 28px; height: 28px; vertical-align: middle;"/>
                </a>
              </div>
              <p style="margin: 0;">© 2026 O.z. Nitráčik.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // User Email
    const userHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
          .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
          .content { padding: 30px; color: #333333; line-height: 1.6; text-align: justify; }
          .highlight-box { background-color: #fefce8; border: 1px solid #fde047; border-radius: 6px; padding: 20px; margin: 25px 0; text-align: center; font-style: italic; }
          .message-quote { background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          p { margin-bottom: 15px; }
          .quote-en { color: #d97706; font-weight: bold; font-size: 18px; display: block; margin-bottom: 5px; }
          .quote-sk { color: #555; font-size: 16px; }
        </style>
      </head>
      <body>
        <div style="background-color: #f4f4f4; padding: 40px 0;">
          <div class="container">
            <div class="header">
              <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
            </div>
            <div class="content">
              <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: left;">Dobrý deň, ${name}.</p>
              <p>Ďakujeme za vašu správu! Potvrdzujeme jej prijatie.</p>
              <p>Náš tím si ju prečíta a ozveme sa vám hneď, ako to bude možné.</p>
              <div class="message-quote">
                <p style="margin: 0; font-style: italic; color: #555;">"${message.replace(/\n/g, '<br>')}"</p>
              </div>
              <div class="highlight-box">
                <span class="quote-en">"Every message matters to us!"</span>
                <span class="quote-sk">"Každá správa je pre nás dôležitá!"</span>
              </div>
              <div style="margin-top: 30px;">
                <p style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #ef3f3f; margin-bottom: 5px;">Saška</p>
                <p style="font-size: 14px; margin: 0;"><strong>JUDr. Košičárová Alexandra</strong></p>
                <p style="font-size: 13px; color: #666; margin: 0;">Štatutárka a zakladateľka O.z. Nitráčik</p>
              </div>
            </div>
            <div class="footer">
              <div style="margin-bottom: 15px;">
                <a href="https://www.instagram.com/nitracik/" style="text-decoration: none; margin: 0 10px;">
                  <img src="cid:igIcon" alt="Instagram" style="width: 28px; height: 28px; vertical-align: middle;"/>
                </a>
                <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="text-decoration: none; margin: 0 10px;">
                  <img src="cid:fbIcon" alt="Facebook" style="width: 28px; height: 28px; vertical-align: middle;"/>
                </a>
              </div>
              <p style="margin: 0;">© 2026 O.z. Nitráčik.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return Promise.all([
      transporter.sendMail({
        from: SENDER,
        to: adminEmail,
        replyTo: email,
        subject: `Nová správa: ${name}`,
        html: injectImageUrls(adminHtml),
        attachments: getCommonAttachments()
      }),
      transporter.sendMail({
        from: SENDER,
        to: email,
        subject: 'Prijali sme vašu správu - Nitráčik',
        html: injectImageUrls(userHtml),
        attachments: getCommonAttachments()
      })
    ]);
  },

  // --- 10a. REFUND CONFIRMATION (USER) ---
  sendRefundConfirmationEmail: async (userEmail, { userName, refundId, amount, trainingType, trainingDate }) => {
    const formattedDate = trainingDate ? dayjs(trainingDate).tz('Europe/Bratislava').format('DD.MM.YYYY') : null;
    const subject = 'Potvrdenie refundu | Nitráčik';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
          .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #dc2626; }
          .content { padding: 30px; color: #333333; line-height: 1.6; text-align: justify; }
          .info-box { background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 20px; margin: 20px 0; }
          .info-row { margin-bottom: 8px; font-size: 15px; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          p { margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div style="background-color: #f4f4f4; padding: 40px 0;">
          <div class="container">
            <div class="header">
              <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
            </div>
            <div class="content">
              <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: left;">Dobrý deň, ${userName || 'kamarát'}.</p>
              <p>Potvrdzujeme prijatie a spracovanie Vašej žiadosti o refund.</p>

              <div class="info-box">
                <div class="info-row"><strong>Refund ID:</strong> ${refundId}</div>
                <div class="info-row"><strong>Suma:</strong> ${amount} €</div>
                ${trainingType ? `<div class="info-row"><strong>Tréning:</strong> ${trainingType}</div>` : ''}
                ${formattedDate ? `<div class="info-row"><strong>Dátum:</strong> ${formattedDate}</div>` : ''}
                <div class="info-row" style="font-size: 13px; color: #666; margin-top: 10px;">Peniaze by sa mali vrátiť na Váš účet do 5–10 pracovných dní.</div>
              </div>

              <p>Ak by ste mali otázky, stačí odpovedať na tento email.</p>

              <div style="margin-top: 30px;">
                <p style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #ef3f3f; margin-bottom: 5px;">Saška</p>
                <p style="font-size: 14px; margin: 0;"><strong>JUDr. Košičárová Alexandra</strong></p>
                <p style="font-size: 13px; color: #666; margin: 0;">Štatutárka a zakladateľka O.z. Nitráčik</p>
              </div>
            </div>
            <div class="footer">
              <div style="margin-bottom: 15px;">
                <a href="https://www.instagram.com/nitracik/" style="text-decoration: none; margin: 0 10px;">
                  <img src="cid:igIcon" alt="Instagram" style="width: 28px; height: 28px; vertical-align: middle;"/>
                </a>
                <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="text-decoration: none; margin: 0 10px;">
                  <img src="cid:fbIcon" alt="Facebook" style="width: 28px; height: 28px; vertical-align: middle;"/>
                </a>
              </div>
              <p style="margin: 0;">© 2026 O.z. Nitráčik.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return transporter.sendMail({
      from: SENDER,
      to: userEmail,
      subject,
      html: injectImageUrls(html),
      attachments: getCommonAttachments()
    });
  },

  // --- 11. TEST EMAIL (Voliteľné) ---
  sendTestEmail: async (toEmail) => {
    return transporter.sendMail({
      from: SENDER,
      to: toEmail,
      subject: 'Test Email',
      text: 'This is a test email from Nitracik.',
    });
  },

  // 12. RESET HESLA
  sendPasswordResetEmail: async (userEmail, resetLink) => {
    return transporter.sendMail({
      from: SENDER,
      to: userEmail,
      subject: 'Password Reset',
      text: `Click the following link to reset your password: ${resetLink}`,
    });
  },

  // 13. ADMIN NOTIFIKÁCIA O ZRUŠENÍ ÚČTU
  sendAdminAccountDeleteNotification: async (userInfo, itemsData = {}) => {
    const { activeBookings = [], activeSeasonTickets = [], unusedCredits = [], hasActiveItems = false } = itemsData;
    
    let itemsDetailsHTML = '<p style="color: #666;">Užívateľ nemá žiadne aktívne nevyužité subjekty.</p>';
    
    if (hasActiveItems) {
      itemsDetailsHTML = `
        <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <p style="margin-top: 0; font-weight: bold; color: #0369a1;">Aktívne nevyužité subjekty:</p>
          
          ${activeBookings.length > 0 ? `
            <p style="margin: 10px 0 5px 0; font-weight: bold; font-size: 13px; color: #1e40af;">📅 Zaplatené rezervácie (${activeBookings.length}):</p>
            <ul style="margin: 0 0 10px 20px; padding: 0; font-size: 13px;">
              ${activeBookings.map(booking => `
                <li>
                  ${booking.training_type} - ${new Date(booking.training_date).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })}
                  (${booking.number_of_children} ${booking.number_of_children === 1 ? 'dieťa' : 'detí'}) - 
                  Zaplatená čiastka: €${parseFloat(booking.amount_paid || 0).toFixed(2)}
                </li>
              `).join('')}
            </ul>
          ` : ''}
          
          ${activeSeasonTickets.length > 0 ? `
            <p style="margin: 10px 0 5px 0; font-weight: bold; font-size: 13px; color: #1e40af;">🎫 Platné permanentky (${activeSeasonTickets.length}):</p>
            <ul style="margin: 0 0 10px 20px; padding: 0; font-size: 13px;">
              ${activeSeasonTickets.map(ticket => `
                <li>
                  ${ticket.training_type_name || 'Permanentka'} - ${ticket.entries_remaining}/${ticket.entries_total} vstupov
                  Platnosť do: ${new Date(ticket.expiry_date).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })} - 
                  Zaplatená čiastka: €${parseFloat(ticket.amount_paid || 0).toFixed(2)}
                </li>
              `).join('')}
            </ul>
          ` : ''}
          
          ${unusedCredits.length > 0 ? `
            <p style="margin: 10px 0 5px 0; font-weight: bold; font-size: 13px; color: #1e40af;">💳 Nepoužité kredity (${unusedCredits.length}):</p>
            <ul style="margin: 0; padding: 0 0 0 20px; font-size: 13px;">
              ${unusedCredits.map(credit => `
                <li>
                  ${credit.training_type} - ${credit.child_count} ${credit.child_count === 1 ? 'dieťa' : 'detí'}
                  (vytvorené: ${new Date(credit.created_at).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })})
                </li>
              `).join('')}
            </ul>
          ` : ''}
        </div>
      `;
    }

    const subject = `⚠️ Zrušenie účtu - ${userInfo.first_name} ${userInfo.last_name || ''}`;
    
    const mailOptions = {
      from: SENDER,
      to: 'info@nitracik.sk', // Posielame adminovi
      subject,
      html: injectImageUrls(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { width: 100%; max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
            .header h2 { margin: 0; font-size: 24px; }
            .content { padding: 30px; color: #333333; line-height: 1.6; }
            .user-info { background-color: #f9fafb; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
            td:first-child { font-weight: bold; width: 200px; color: #6b7280; }
            p { margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div style="background-color: #f4f4f4; padding: 40px 0;">
            <div class="container">
              <div class="header">
                <h2>🔔 Notifikácia o zrušení účtu</h2>
              </div>
              <div class="content">
                <p>Dobrý deň,</p>
                <p>Užívateľ si práve zrušil svoj účet. Tu sú podrobnosti:</p>
                
                <div class="user-info">
                  <table>
                    <tr>
                      <td>Meno:</td>
                      <td><strong>${userInfo.first_name} ${userInfo.last_name || ''}</strong></td>
                    </tr>
                    <tr>
                      <td>Email:</td>
                      <td>${userInfo.email}</td>
                    </tr>
                    <tr>
                      <td>Telefón:</td>
                      <td>${userInfo.mobile || 'Nezadaný'}</td>
                    </tr>
                    <tr>
                      <td>ID užívateľa:</td>
                      <td>${userInfo.id}</td>
                    </tr>
                    <tr>
                      <td>Dátum zrušenia:</td>
                      <td>${new Date().toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  </table>
                </div>
                
                <p style="font-weight: bold; margin-top: 25px; margin-bottom: 10px;">Status aktívnych subjektov:</p>
                ${itemsDetailsHTML}
                
                <p style="margin-top: 25px; background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; font-size: 13px; color: #92400e;">
                  <strong>Poznámka:</strong> Podľa obchodných podmienok (bod 5.10), užívateľ má možnosť využívať aktívne subjekty 
                  na základe dohody s majiteľom. Kontaktujte ho ak má nejaké otázky.
                </p>
              </div>
              <div class="footer">
                <p style="margin: 0;">© 2026 O.z. Nitráčik - Admin Notifikácia</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `),
      attachments: getCommonAttachments()
    };
    
    return transporter.sendMail(mailOptions);
  },

  sendPaymentFailedEmail: async (userEmail, firstName, data) => {
    const { selectedDate, selectedTime, trainingType, totalPrice } = data;
    
    const mailOptions = {
      from: SENDER,
      to: userEmail,
      subject: '⚠️ Vaša platba zlyhala - Nitráčik',
      html: `
        <!DOCTYPE html>
        <html lang="sk">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background-color: #e74c3c; padding: 20px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .alert-box { background-color: #fdeaea; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .alert-box strong { color: #c0392b; }
            .booking-details { background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .detail-label { font-weight: bold; color: #333; }
            .detail-value { color: #666; }
            .btn { display: inline-block; padding: 12px 30px; background-color: #3498db; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
            .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .footer p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Platba zlyhala</h1>
            </div>
            <div class="content">
              <p>Ahoj ${firstName || 'Osôbka'},</p>
              
              <div class="alert-box">
                <strong>Vaša platba sa nepodarila!</strong> Skúsili sme spracovať vašu platbu, ale z neznámych dôvodov (napr. chyba siete, problém s kartou) sa to nepodarilo.
              </div>

              <p>Detaily vašej rezervácie:</p>
              <div class="booking-details">
                <div class="detail-row">
                  <span class="detail-label">Typ tréningu:</span>
                  <span class="detail-value">${trainingType || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Dátum & Čas:</span>
                  <span class="detail-value">${selectedDate || ''} ${selectedTime || ''}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Suma:</span>
                  <span class="detail-value">${totalPrice || ''} €</span>
                </div>
              </div>

              <h3 style="color: #333;">Čo môžete urobiť?</h3>
              <ul style="color: #666;">
                <li><strong>Skúste znova:</strong> Návštevou svojho profilu sa pokúste rezerváciu ešte raz s rovnakými údajmi.</li>
                <li><strong>Skontrolujte svoju kartu:</strong> Uistite sa, že máte dostatok prostriedkov a že sú detaily karty správne.</li>
                <li><strong>Kontaktujte nás:</strong> Ak problém pretrváva, prosím <a href="mailto:info@nitracik.sk">kontaktujte nás</a>.</li>
              </ul>

              <p>Vaša rezervácia <strong>nebola potvrdená</strong>, keďže sme nedostali potvrdenie platby. Môžete sa pokúsiť rezervovať znova.</p>

              <center>
                <a href="${process.env.FRONTEND_URL}/booking" class="btn">Pokúsiť sa znova</a>
              </center>
            </div>
            <div class="footer">
              <p>© 2026 O.z. Nitráčik</p>
              <p>Ak ste si túto správu nevyžiadali, prosím ju ignorujte.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return transporter.sendMail(mailOptions);
  },

  sendReviewRequestEmail: async (userEmail, firstName, trainingData) => {
    const formattedTrainingDate = dayjs(trainingData.trainingDate).utc().tz('Europe/Bratislava').format('DD.MM.YYYY (dddd) HH:mm');

    const mailOptions = {
      from: SENDER,
      to: userEmail,
      subject: 'Ako sa vám páčila hodina? 🌟 | Nitráčik',
      html: injectImageUrls(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
            .content { padding: 30px; color: #333333; line-height: 1.6; text-align: justify; }
            .highlight-box { background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 20px; margin: 25px 0; text-align: center; }
            .btn-verify { display: block; width: 200px; margin: 20px auto; padding: 12px 20px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; text-align: center; font-weight: bold; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
            p { margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div style="background-color: #f4f4f4; padding: 40px 0;">
            <div class="container">
              <div class="header">
                <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
              </div>
              <div class="content">
                <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: left;">Dobrý deň, ${firstName}.</p>
                <p>Dúfame, že si hodina ${trainingData.trainingType} bola plná zábavy a krásnych chvíľ! Vaša spätná väzba je pre nás veľmi dôležitá.</p>
                <p style="margin-bottom: 0;"><strong>Termín hodiny:</strong> ${formattedTrainingDate}</p>

                <div class="highlight-box">
                  <p style="margin: 0 0 12px 0;">Budeme veľmi radi, ak nám zanecháte krátku recenziu na Google.</p>
                  <a href="${GOOGLE_REVIEW_URL}" class="btn-verify">Napísať recenziu na Google ⭐</a>
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(GOOGLE_REVIEW_URL)}" alt="QR kód pre Google recenziu" style="display: block; margin: 12px auto 6px auto; width: 150px; height: 150px;"/>
                  <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">Alebo naskenujte QR kód</p>
                </div>

                <p>Ďakujeme, že ste súčasťou Nitráčik komunity. Tešíme sa na vás na ďalšej hodine!</p>

                <div style="margin-top: 30px;">
                  <p style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #ef3f3f; margin-bottom: 5px;">Saška</p>
                  <p style="font-size: 14px; margin: 0;"><strong>JUDr. Košičárová Alexandra</strong></p>
                  <p style="font-size: 13px; color: #666; margin: 0;">Štatutárka a zakladateľka O.z. Nitráčik</p>
                </div>
              </div>
              <div class="footer">
                <div style="margin-bottom: 15px;">
                  <a href="https://www.instagram.com/nitracik/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:igIcon" alt="Instagram" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                  <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:fbIcon" alt="Facebook" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                </div>
                <p style="margin: 0;">© 2026 O.z. Nitráčik.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `),
      attachments: getCommonAttachments()
    };

    return transporter.sendMail(mailOptions);
  },

  sendBulkAdminEmail: async (recipients, subject, message, trainingInfo) => {
    const formattedDate = dayjs(trainingInfo.training_date)
      .tz('Europe/Bratislava')
      .format('DD.MM.YYYY (dddd) HH:mm');

    const sendPromises = recipients.map(({ email, first_name }) => {
      const mailOptions = {
        from: SENDER,
        to: email,
        subject: subject,
        html: injectImageUrls(`
          <!DOCTYPE html>
          <html lang="sk">
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
              .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #eab308; }
              .content { padding: 30px; color: #333; line-height: 1.7; }
              .info-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 16px; margin: 20px 0; font-size: 14px; color: #92400e; }
              .message-box { background: #f9fafb; border-left: 4px solid #2563eb; padding: 20px; border-radius: 0 6px 6px 0; margin: 20px 0; white-space: pre-wrap; line-height: 1.8; }
              .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div style="background-color:#f4f4f4; padding: 40px 0;">
              <div class="container">
                <div class="header">
                  <img src="cid:nitracikLogo" alt="Nitráčik" style="width:220px; height:auto; display:block; margin:0 auto;"/>
                </div>
                <div class="content">
                  <p style="font-size:18px; font-weight:bold;">Dobrý deň, ${first_name}.</p>

                  <div class="info-box">
                    📅 Správa sa týka hodiny: <strong>${trainingInfo.training_type} — ${formattedDate}</strong>
                  </div>

                  <div class="message-box">${message}</div>

                  <p style="margin-top: 24px;">V prípade otázok nás kontaktujte na <a href="mailto:info@nitracik.sk" style="color:#2563eb;">info@nitracik.sk</a>.</p>

                  <div style="margin-top: 30px;">
                    <p style="font-family: 'Brush Script MT', cursive; font-size:24px; color:#ef3f3f; margin-bottom:4px;">Saška</p>
                    <p style="font-size:14px; margin:0;"><strong>JUDr. Košičárová Alexandra</strong></p>
                    <p style="font-size:13px; color:#666; margin:0;">Štatutárka a zakladateľka O.z. Nitráčik</p>
                  </div>
                </div>
                <div class="footer">
                  <div style="margin-bottom:12px;">
                    <a href="https://www.instagram.com/nitracik/" style="margin:0 8px;">
                      <img src="cid:igIcon" alt="Instagram" style="width:26px; height:26px; vertical-align:middle;"/>
                    </a>
                    <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="margin:0 8px;">
                      <img src="cid:fbIcon" alt="Facebook" style="width:26px; height:26px; vertical-align:middle;"/>
                    </a>
                  </div>
                  <p style="margin:0;">© 2026 O.z. Nitráčik</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `),
        attachments: getCommonAttachments()
      };
      return transporter.sendMail(mailOptions);
    });

    return Promise.allSettled(sendPromises);
  },

  // --- GIFT CARD EMAIL ---
  sendGiftCardEmail: async (toEmail, { code, amount, balance, recipientName, message, expiresAt, isBuyer }) => {
    const formattedExpiry = dayjs(expiresAt).tz('Europe/Bratislava').format('DD.MM.YYYY');
    const subject = isBuyer
      ? `🎁 Darčekový poukaz Nitráčik – ${amount}€ bol zakúpený`
      : `🎁 Niekto ti posiela darček od Nitráčika!`;

    const intro = isBuyer
      ? `Ďakujeme za nákup darčekového poukazu! Nižšie nájdete vygenerovaný kód, ktorý môžete odovzdať obdarovanému.`
      : `Niekto na vás myslel a zakúpil vám darčekový poukaz do Nitráčika. Nižšie nájdete váš jedinečný kód.`;

    const mailOptions = {
      from: SENDER,
      to: toEmail,
      subject,
      html: injectImageUrls(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #f59e0b; }
            .content { padding: 30px; color: #333333; line-height: 1.6; text-align: justify; }
            .voucher-box { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #f59e0b; border-radius: 16px; padding: 30px; margin: 25px 0; text-align: center; }
            .voucher-amount { font-size: 48px; font-weight: 900; color: #d97706; margin: 0 0 8px 0; }
            .voucher-label { font-size: 14px; color: #92400e; margin: 0 0 20px 0; letter-spacing: 1px; text-transform: uppercase; }
            .code-box { background-color: #ffffff; border: 2px dashed #f59e0b; border-radius: 10px; padding: 16px 24px; display: inline-block; margin: 10px 0; }
            .code-text { font-family: 'Courier New', monospace; font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #92400e; }
            .code-label { font-size: 11px; color: #b45309; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; }
            .highlight-box { background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: left; }
            .highlight-item { margin-bottom: 6px; font-size: 15px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
            p { margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div style="background-color: #f4f4f4; padding: 40px 0;">
            <div class="container">
              <div class="header">
                <img src="cid:nitracikLogo" alt="Nitráčik Logo" style="width: 240px; height: auto; display: block; margin: 0 auto;"/>
              </div>
              <div class="content">
                <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: left;">
                  ${isBuyer ? 'Ďakujeme za nákup!' : `Darček pre ${recipientName}! 🎉`}
                </p>
                <p>${intro}</p>

                <div class="voucher-box">
                  <p class="voucher-label">Darčekový poukaz Nitráčik</p>
                  <p class="voucher-amount">${amount}€</p>
                  ${recipientName ? `<p style="font-size: 16px; color: #92400e; margin: 0 0 16px 0;">Pre: <strong>${recipientName}</strong></p>` : ''}
                  ${message ? `<p style="font-size: 14px; color: #78350f; font-style: italic; margin: 0 0 20px 0; padding: 10px; background: rgba(255,255,255,0.6); border-radius: 8px;">"${message}"</p>` : ''}
                  <div class="code-box">
                    <div class="code-text">${code}</div>
                    <div class="code-label">Váš jedinečný kód</div>
                  </div>
                </div>

                <div class="highlight-box">
                  <div class="highlight-item">💰 <strong>Hodnota poukazu:</strong> ${amount}€</div>
                  <div class="highlight-item">💳 <strong>Zostatok:</strong> ${balance}€</div>
                  <div class="highlight-item">📅 <strong>Platnosť do:</strong> ${formattedExpiry}</div>
                  <div class="highlight-item" style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #fcd34d; font-size: 14px; color: #92400e;">
                    💡 Kód zadajte v rezervačnom formulári na <strong>nitracik.sk/booking</strong> v sekcii <em>"Máte darčekový poukaz?"</em>
                  </div>
                </div>

                <p>Poukaz je možné využiť jednorazovo alebo čiastočne – zostatok zostáva k dispozícii na ďalšie rezervácie.</p>

                <div style="margin-top: 30px;">
                  <p style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #ef3f3f; margin-bottom: 5px;">Saška</p>
                  <p style="font-size: 14px; margin: 0;"><strong>JUDr. Košičárová Alexandra</strong></p>
                  <p style="font-size: 13px; color: #666; margin: 0;">Štatutárka a zakladateľka O.z. Nitráčik</p>
                  <p style="font-size: 13px; color: #666; margin: 0;">+421 949 584 576</p>
                </div>
              </div>
              <div class="footer">
                <div style="margin-bottom: 15px;">
                  <a href="https://www.instagram.com/nitracik/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:igIcon" alt="Instagram" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                  <a href="https://www.facebook.com/p/Nitr%C3%A1%C4%8Dik-61558994166250/" style="text-decoration: none; margin: 0 10px;">
                    <img src="cid:fbIcon" alt="Facebook" style="width: 28px; height: 28px; vertical-align: middle;"/>
                  </a>
                </div>
                <p style="margin: 0;">© 2026 O.z. Nitráčik. Všetky práva vyhradené.</p>
                <p style="margin: 5px 0 0 0;">info@nitracik.sk</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `),
      attachments: getCommonAttachments()
    };
    return transporter.sendMail(mailOptions);
  },
}; // Koniec module.exports

