// services/emailService.js
const nodemailer = require('nodemailer');
const path = require('path');
const dayjs = require('dayjs');
require('dayjs/locale/sk');
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

// Pridajte aj tento diagnostický log hneď pod to:
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ CRITICAL: Email server connection failed:', error.message);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Verejné URL obrázkov (backend static files)
const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/images`;
const IMAGE_URLS = {
  logo: `${IMAGE_BASE_URL}/email/logo_bez.PNG`,
  instagram: `${IMAGE_BASE_URL}/email/instagram.png`,
  facebook: `${IMAGE_BASE_URL}/email/facebook.png`
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
    const trainingDate = dayjs(firstRow.training_date);
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
        row.booking_type === 'paid' ? 'Normálna rezervácia' :
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
                <p>Už Vám chýba len jeden malý krok, aby ste sa mohli naplno ponoriť do nášho sveta plného farieb a zábavy. Prosím, potvrďte svoju registráciu kliknutím na tlačidlo nižšie:</p>
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
    const bookingDate = dayjs(sessionDetails.date).format('DD.MM.YYYY');
    const bookingDay = dayjs(sessionDetails.date).format('dddd');
    const formattedDateString = `${bookingDate} (${bookingDay})`;

    const SUBJECTS = {
      credit: 'Rezervácia – uhradená kreditom | Nitráčik',
      season_ticket: 'Rezervácia – uplatnený permanentný vstup | Nitráčik',
      payment: 'Potvrdenie rezervácie | Nitráčik'
    };
    const PAYMENT_TEXT = {
      credit: 'rezervácia bola uhradená z vášho kreditu',
      season_ticket: 'rezervácia bola odpočítaná z permanentného vstupu',
      payment: 'platba prebehla úspešne'
    };

    const pType = sessionDetails.paymentType || 'payment';
    const subject = SUBJECTS[pType] || SUBJECTS['payment'];
    const paymentInfo = PAYMENT_TEXT[pType] || PAYMENT_TEXT['payment'];

    // === NOVÉ: SEASON TICKET INFO ===
    let seasonTicketRows = '';
    // Skontrolujeme, či máme dáta o permanentke (posielame ich teraz zo server.js)
    if (pType === 'season_ticket' && sessionDetails.remainingEntries !== undefined) {
      const expiryFormatted = dayjs(sessionDetails.expiryDate).format('DD.MM.YYYY');
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
                  <div class="highlight-item">📍 <strong>Miesto:</strong> 
                      <a href="https://www.google.com/maps/search/?api=1&query=Štefánikova+trieda+148,+Nitra" 
                        style="color: #2563eb; text-decoration: underline;">
                        Štefánikova trieda 148, Nitra</a>
                  </div>
                  
                  ${seasonTicketRows} 
                  
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

  // 3. Delete account email
  sendAccountDeletedEmail: async (userEmail, userName) => {
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
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #ef4444; } /* Červená linka pre delete */
            .content { padding: 30px; color: #333333; line-height: 1.6; text-align: justify; }
            .highlight-box { background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 20px; margin: 25px 0; text-align: center; font-style: italic; }
            .highlight-item { margin-bottom: 5px; font-size: 15px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
            p { margin-bottom: 15px; }
            .quote-en { color: #ef4444; font-weight: bold; font-size: 18px; display: block; margin-bottom: 5px; }
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
                <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: left;">Dobrý deň, ${userName || 'kamarát'}.</p>
                <p>S ľútosťou Vám potvrdzujem, že Váš účet bol na Vašu žiadosť úspešne zrušený a Vaše osobné údaje boli vymazané z nášho systému.</p>
                <p>Hoci sa naše cesty nateraz rozchádzajú, chcem Vám poďakovať, že ste boli súčasťou nášho ufúľaného sveta.</p>
                <p>Mrzí nás, že odchádzate, ale dvere u nás máte vždy otvorené. Kedykoľvek sa na nás v budúcnosti obrátite, radi Vás opäť privítame medzi nami.</p>
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
  sendSeasonTicketConfirmation: async (userEmail, userName, { entries, totalPrice, expiryDate, trainingTypeName }) => {
    // Naformátujeme dátumy do slovenčiny
    const formattedPurchaseDate = dayjs().format('DD.MM.YYYY');
    const formattedExpiryDate = dayjs(expiryDate).format('DD.MM.YYYY');

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
                ${trainingTypeName ? `<p>Typ permanentky: <strong>${trainingTypeName}</strong></p>` : ''}
                ${trainingTypeName ? `<p style="font-size: 13px; color: #666;">Odteraz ju môžete využiť na hodinu <strong>${trainingTypeName}</strong>. Permanentka sa vám zobrazí v rezervačnom formulári.</p>` : ''}
                
                <p>Už teraz sa tešíme na všetky Vaše budúce návštevy. S permanentkou máte vstup do nášho farebného sveta ešte jednoduchší.</p>

                <div class="highlight-box">
                   <div class="highlight-item">🎟️ <strong>Počet vstupov:</strong> ${entries}</div>
                   ${trainingTypeName ? `<div class="highlight-item">🎨 <strong>Typ tréningu:</strong> ${trainingTypeName}</div>` : ''}
                   <div class="highlight-item">💰 <strong>Cena:</strong> ${totalPrice} €</div>
                   <div class="highlight-item">📅 <strong>Dátum nákupu:</strong> ${formattedPurchaseDate}</div>
                   <div class="highlight-item">⏳ <strong>Platnosť (6 mesiacov):</strong> ${formattedExpiryDate}</div>
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
    const formattedPurchaseDate = dayjs().format('DD.MM.YYYY');
    const formattedExpiryDate = dayjs(data.expiryDate).format('DD.MM.YYYY');

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
                  ${data.trainingTypeName ? `<div class="info-row"><span class="info-label">🎨 Typ tréningu:</span> ${data.trainingTypeName}</div>` : ''}
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
      subject: 'Nová rezervácia - Nitráčik (Platba)',
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
                <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #16a34a;">🎉 Nová rezervácia (Platba kartou)!</p>
                
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
                  <div class="info-row">
                    <span class="info-label">🔑 Payment Intent:</span> <span style="font-size: 12px; color: #6b7280;">${data.paymentIntentId}</span>
                  </div>
                  
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

    // Formátovanie dátumu
    const dateStr = new Date(data.training.training_date).toLocaleString('sk-SK');
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
    const dateStr = new Date(booking.training_date).toLocaleString('sk-SK');

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
             userRefundText = `
                <strong>Vrátenie kreditu:</strong><br>
                Kredit v hodnote tréningu bol vrátený na váš účet v Nitráčiku.
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
                    Pohodlnejšie riešenie bez čakania. Hodnota tréningu Vám bude okamžite pripísaná ako <strong>kredit</strong> do Vášho profilu (Typ: ${trainingType}, Deti: ${childrenCount}). Môžete ho použiť na akýkoľvek iný termín bez nutnosti novej platby.
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
              <p style="margin: 5px 0 0 0;">oznitracik@gmail.com</p>
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
              <p style="margin: 5px 0 0 0;">oznitracik@gmail.com</p>
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
    const formattedDate = trainingDate ? dayjs(trainingDate).format('DD.MM.YYYY') : null;
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
  }
}; // Koniec module.exports

