// services/emailService.js
const nodemailer = require('nodemailer');
const path = require('path');
const dayjs = require('dayjs');
require('dayjs/locale/sk');
dayjs.locale('sk');

// Konfigurácia odosielateľa
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false } // Pre istotu, ak by bol problém s certifikátom
});

// Pomocné konštanty
const getCommonAttachments = () => [
    { filename: 'logo_bez.PNG', path: path.join(__dirname, '..', 'public', 'logo_bez.PNG'), cid: 'nitracikLogo' },
    { filename: 'instagram.png', path: path.join(__dirname, '..', 'public', 'instagram.png'), cid: 'igIcon' },
    { filename: 'facebook.png', path: path.join(__dirname, '..', 'public', 'facebook.png'), cid: 'fbIcon' }
];

module.exports = {
    // 1. Overovací email
    sendVerificationEmail: async (userEmail, userName, verificationLink) => {
        const subject = 'Vitajte v Nitráčiku - Overenie emailu';
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject,
            html: `
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
      `,
            attachments: getCommonAttachments()
        };
        return transporter.sendMail(mailOptions);
    },

    // 2. Booking email
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
        const subject = SUBJECTS[pType];
        const paymentInfo = PAYMENT_TEXT[pType];

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject,
            html: `
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
      `,
            attachments: getCommonAttachments()
        };
        return transporter.sendMail(mailOptions);
    },

    // 3. Delete account email
    sendAccountDeletedEmail: async (userEmail, userName) => {
        const subject = 'Rozlúčka s Nitráčikom - Potvrdenie zrušenia účtu';
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject,
            html: `
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
      `,
            attachments: getCommonAttachments()
        };
        return transporter.sendMail(mailOptions);
    },

    // --- 4. USER: SEASON TICKET PURCHASE (STRIPE WEBHOOK) ---
  sendSeasonTicketConfirmation: async (userEmail, userName, { entries, totalPrice, expiryDate }) => {
    // Naformátujeme dátumy do slovenčiny
    const formattedPurchaseDate = dayjs().format('DD.MM.YYYY');
    const formattedExpiryDate = dayjs(expiryDate).format('DD.MM.YYYY');

    const subject = 'Potvrdenie nákupu permanentky | Nitráčik';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject,
      html: `
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
                
                <p>Už teraz sa tešíme na všetky Vaše budúce návštevy. S permanentkou máte vstup do nášho farebného sveta ešte jednoduchší.</p>

                <div class="highlight-box">
                   <div class="highlight-item">🎟️ <strong>Počet vstupov:</strong> ${entries}</div>
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
      `,
      attachments: getCommonAttachments()
    };
    return transporter.sendMail(mailOptions);
  },

    // --- 5. ADMIN: NEW BOOKING NOTIFICATION (STANDARD) ---
    sendAdminNewBookingNotification: async (adminEmail, data) => {
        // Helper na formátovanie booleanov
        const formatBool = (val) => (val === true || val === 'true' ? 'Yes/Agreed' : 'No/Declined');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: adminEmail,
            subject: 'New Booking Request',
            text: `
        User: ${data.user.first_name} ${data.user.last_name}
        Email: ${data.user.email}
        Address: ${data.user.address}
        Mobile: ${data.mobile || 'Not provided'}
        Children: ${data.childrenCount}
        Children Age: ${data.childrenAge}
        Training: ${data.trainingType}
        Date: ${data.selectedDate}
        Time: ${data.selectedTime}
        Photo Consent: ${formatBool(data.photoConsent)}
        Accompanying Person: ${formatBool(data.accompanyingPerson)}
        Notes: ${data.note || 'No additional notes'}
        Price: €${data.totalPrice}
        Payment Intent: ${data.paymentIntentId}
      `.trim(),
        };
        return transporter.sendMail(mailOptions);
    },

    // --- 6. ADMIN: SEASON TICKET USE NOTIFICATION ---
    sendAdminSeasonTicketUsage: async (adminEmail, data) => {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: adminEmail,
            subject: 'New Booking Request (Season Ticket)',
            text: `
        User: ${data.user.first_name} ${data.user.last_name}
        Email: ${data.user.email}
        Address: ${data.user.address}
        Mobile: ${data.mobile || 'Not provided'}
        Children: ${data.childrenCount}
        Children Age: ${data.childrenAge}
        Training: ${data.trainingType}
        Date: ${data.selectedDate}
        Time: ${data.selectedTime}
        Photo Consent: ${(data.photoConsent === true || data.photoConsent === 'true') ? 'Agreed' : 'Declined'}
        Notes: ${data.note || 'No additional notes'}
        Season Ticket ID: ${data.seasonTicketId}
      `.trim(),
        };
        return transporter.sendMail(mailOptions);
    },

    // --- 7. ADMIN: CREDIT USAGE NOTIFICATION ---
    sendAdminCreditUsage: async (adminEmail, data) => {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: adminEmail,
            subject: 'Credit-Based Booking Created',
            text: `
        New booking created using credit:
        User: ${data.user.first_name} ${data.user.last_name}
        Email: ${data.user.email}
        Training: ${data.training.training_type}
        Date: ${new Date(data.training.training_date).toLocaleString()}
        Children: ${data.credit.child_count}
        Children Ages: ${data.finalChildrenAges}
        Mobile: ${data.finalMobile}
        Photo Consent: ${data.finalPhotoConsent ? 'Agreed' : 'Declined'}
        Notes: ${data.finalNote || 'None'}
        Booking ID: ${data.bookingId}
        Credit ID: ${data.creditId}
        Original cancelled session cleared: ${data.originalSessionId || 'N/A'}
      `.trim(),
        };
        return transporter.sendMail(mailOptions);
    },

    // --- 8. CANCELLATION (SINGLE) - ADMIN & USER ---
    sendCancellationEmails: async (adminEmail, userEmail, booking, refundData, usageResult) => {
        // Admin email
        const adminMsg = {
            from: process.env.EMAIL_USER,
            to: adminEmail,
            subject: 'Session Cancellation Notification',
            text: `
        Session Cancellation
        User: ${booking.first_name} ${booking.last_name}
        Email: ${booking.email}
        Training: ${booking.training_type}
        Date: ${new Date(booking.training_date).toLocaleString()}
        Children: ${booking.number_of_children}
        Refund Status: ${refundData ? (refundData.id ? `Processed (${refundData.id})` : `Failed: ${refundData.error}`) : 'Not applicable (season ticket)'}
        Amount: €${booking.amount_paid || 0}
      `.trim(),
        };

        // User logic text generation
        let refundText = '';
        if (refundData && refundData.id) {
            refundText = `Refund Information:\n- Amount: €${booking.amount_paid}\n- Refund ID: ${refundData.id}\n- Status: ${refundData.status}\nThe refund may take 5-10 business days to appear in your account.`;
        } else if (refundData && refundData.error) {
            refundText = `Refund Status: Failed to process refund: ${refundData.error}. Please contact support.`;
        } else if (usageResult && usageResult.rows.length > 0) {
            refundText = `Season Ticket: ${booking.number_of_children} entries have been returned to your season ticket.`;
        }

        const userMsg = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Session Cancellation Confirmation',
            text: `
        Hello ${booking.first_name},
        Your ${booking.training_type} training session on ${new Date(booking.training_date).toLocaleString()} has been successfully canceled.
        
        ${refundText}
        
        If you have any questions, please contact us.
        Best regards,
        Nitracik Team
      `.trim(),
        };

        // Pošleme oba naraz
        return Promise.all([
            transporter.sendMail(adminMsg),
            transporter.sendMail(userMsg)
        ]);
    },

    // --- 9. MASS CANCELLATION (ADMIN TRIGGERED) ---
    sendMassCancellationEmail: async (userEmail, booking, reason, frontendUrl) => {
        const refundUrl = `${frontendUrl}/refund-option?bookingId=${booking.booking_id}&action=refund`;
        const creditUrl = `${frontendUrl}/refund-option?bookingId=${booking.booking_id}&action=credit`;
        const sessionDate = new Date(booking.training_date).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' });

        const html = `
      <div style="font-family:Arial, sans-serif; line-height:1.6;">
        <h3>Training Session Cancelled</h3>
        <p>Dear ${booking.first_name},</p>
        <p>Your <strong>${booking.training_type}</strong> training on <strong>${sessionDate}</strong> has been cancelled.</p>
        <p>Reason: ${reason || 'No reason provided.'}</p>
        <p>Please choose one of the following:</p>
        <div style="margin:20px 0;">
          <a href="${refundUrl}" style="background:#e63946;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">💳 Request Refund</a>
          &nbsp;&nbsp;
          <a href="${creditUrl}" style="background:#2a9d8f;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">🎫 Accept Credit</a>
        </div>
        <p>If you take no action, your payment will remain on hold.</p>
        <p>Best regards,<br/>Nitracik Team</p>
      </div>
    `;

        return transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Cancelled: ${booking.training_type} Training`,
            html,
        });
    },

    // --- 10. CONTACT FORM ---
  sendContactFormEmails: async (adminEmail, { name, email, message }) => {
    // Admin Notification
    const adminMsg = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `New Contact Form Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}\n\nSent from Nitracik contact form.`.trim(),
      replyTo: email
    };

    // User Confirmation
    const userMsg = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting Nitracik',
      text: `
        Dear ${name},
        
        Thank you for contacting Nitracik! We have received your message and will get back to you as soon as possible.
        
        Your message:
        "${message}"
        
        Best regards,
        Nitracik Team
      `.trim()
    };

    return Promise.all([
      transporter.sendMail(adminMsg),
      transporter.sendMail(userMsg)
    ]);
  },

  // --- 11. TEST EMAIL (Voliteľné) ---
  sendTestEmail: async (toEmail) => {
    return transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: 'Test Email',
      text: 'This is a test email from Nitracik.',
    });
  },

  // 12. RESET HESLA
  sendPasswordResetEmail: async (userEmail, resetLink) => {
    return transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Password Reset',
      text: `Click the following link to reset your password: ${resetLink}`,
    });
  }
}; // Koniec module.exports

