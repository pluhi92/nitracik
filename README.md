# Nitracik - Rezervačný Systém pre Detské Tréningy

Moderná webová aplikácia pre rezerváciu a správu detských športových tréningov s plnou podporou slovenského a anglického jazyka.

## 📋 Prehľad Projektu

Nitracik je komplexný rezervačný systém navrhnutý pre športové centrá, ktoré ponúkajú tréningy pre deti. Aplikácia poskytuje plnohodnotný systém pre správu rezervácií, užívateľských profilov, permanentiek a platieb.

### 🎯 Hlavné Funkcie

- **Rezervačný Systém**
  - Výber typov tréningov (MINI, MIDI, MAXI)
  - Interaktívny kalendár s dostupnými termínmi
  - Podpora viacerých detí v jednej rezervácii
  - Možnosť sprevádzajúcich osôb

- **Správa Užívateľských Profilov**
  - Registrácia a prihlásenie užívateľov
  - Osobné profily s históriou rezervácií
  - Správa permanentiek a kreditov
  - Emailová verifikácia účtov

- **Platobný Systém**
  - Integrácia s Stripe platobnou bránou
  - Podpora permanentiek a jednorázových platieb
  - Automatické spracovanie refundácií
  - Generovanie platobných reportov

- **Administračné Rozhranie**
  - Správa tréningových termínov
  - Kontrola prezenčných listín
  - Generovanie reportov a štatistík
  - Správa obsahu blogu

- **Multilingual Support**
  - Plná podpora slovenského a anglického jazyka
  - Preklady všetkých komponentov a emailov
  - Lokalizované dátumy a časy

## 🛠️ Technológia

### Frontend (React)
- **React 19** - Moderný framework pre užívateľské rozhranie
- **React Router** - Správa routingu a navigácie
- **TailwindCSS** - Utility-first CSS framework
- **Bootstrap** - Komponenty pre responzívny design
- **Day.js** - Manipulácia s dátummi a časmi
- **Axios** - HTTP klient pre API komunikáciu
- **React Icons** - Knižnica ikon
- **Framer Motion** - Animácie a prechody

### Backend (Node.js)
- **Express.js** - Web server framework
- **Prisma** - ORM pre databázovú vrstvu
- **PostgreSQL** - Relational databáza
- **JWT** - Autentifikácia a autorizácia
- **bcrypt** - Hashovanie hesiel
- **Stripe** - Platobná brána
- **Nodemailer** - Emailová komunikácia
- **PDFKit** - Generovanie PDF dokumentov

### Vývojové Nástroje
- **ESLint** - Code linting
- **Jest** - Unit testing
- **Nodemon** - Automatický reštart servera
- **PostCSS** - CSS processing

## 📁 Štruktúra Projektu

```
nitracik/
├── src/                          # Frontend zdrojové kódy
│   ├── components/               # React komponenty
│   │   ├── AboutUs.js           # Hlavná stránka
│   │   ├── Booking.js           # Rezervačný formulár
│   │   ├── UserProfile.js       # Užívateľský profil
│   │   ├── SeasonTickets.js     # Permanentky
│   │   ├── Schedule.js          # Rozvrh tréningov
│   │   └── ...                  # Ďalšie komponenty
│   ├── contexts/                # React Context API
│   │   ├── LanguageContext.js  # Jazykové nastavenia
│   │   └── UserContext.js       # Užívateľské dáta
│   ├── locales/                 # Prekladové súbory
│   │   ├── sk.json             # Slovenský preklad
│   │   └── en.json             # Anglický preklad
│   └── styles/                  # CSS štýly
├── booking-backend/              # Backend aplikácia
│   ├── server.js                # Hlavný server file
│   ├── prisma/                  # Databázové schémy
│   ├── services/                # Business logika
│   └── src/                     # Backend zdrojové kódy
└── public/                      # Statické súbory
```

## 🚀 Inštalácia a Spustenie

### Prerequisities
- Node.js (verzia 18+)
- npm alebo yarn
- PostgreSQL databáza
- Stripe účet (pre platby)

### Frontend Inštalácia

1. **Klonovanie repozitára**
   ```bash
   git clone <your-repo-url>
   cd nitracik
   ```

2. **Inštalácia závislostí**
   ```bash
   npm install
   ```

3. **Konfigurácia environment variables**
   ```bash
   cp .env.example .env
   # Upravte .env súbor s vašimi konfiguráciami
   ```

4. **Spustenie development servera**
   ```bash
   npm start
   ```
   Aplikácia bude dostupná na [http://localhost:3000](http://localhost:3000)

### Backend Inštalácia

1. **Navigácia do backend adresára**
   ```bash
   cd booking-backend
   ```

2. **Inštalácia závislostí**
   ```bash
   npm install
   ```

3. **Databázová migrácia**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **Konfigurácia environment variables**
   ```bash
   cp .env.example .env
   # Upravte .env súbor s databázovými a API kľúčmi
   ```

5. **Spustenie backend servera**
   ```bash
   npm run dev
   ```
   Backend server bude dostupný na [http://localhost:5000](http://localhost:5000)

## 📝 Dostupné Skripty

### Frontend
- `npm start` - Development server
- `npm test` - Spustenie testov
- `npm run build` - Production build
- `npm run eject` - Eject from Create React App

### Backend
- `npm start` - Production server
- `npm run dev` - Development server s automatickým reštartom
- `npm test` - Spustenie testov
- `npm run test:watch` - Testy v watch móde
- `npm run test:coverage` - Test coverage report

## 🔧 Konfigurácia

### Environment Variables

**Frontend (.env):**
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
REACT_APP_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

**Backend (.env):**
```
DATABASE_URL=postgresql://username:password@localhost:5432/nitracik
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
EMAIL_HOST=your_email_host
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
```

## 🎨 UI/UX Funkcie

- **Responzívny Design** - Optimalizované pre všetky zariadenia
- **Moderný Design** - Čistý a intuitívny interface
- **Animácie** - Plynulé prechody a mikrointerakcie
- **Dark Mode** - Podpora tmavého tému
- **Cookie Consent** - GDPR kompatibilný súhlas
- **Loading States** - Indikátory načítavania

## 🔐 Bezpečnosť

- **JWT Autentifikácia** - Bezpečná správa session
- **Hashovanie Hesiel** - bcrypt ochrana
- **Rate Limiting** - Ochrana proti DDoS útokom
- **CORS Konfigurácia** - Bezpečná cross-origin komunikácia
- **Input Validácia** - Ochrana proti XSS a SQL injection
- **HTTPS Only** - Vynútená bezpečná komunikácia

## 📊 API Endpoints

### Autentifikácia
- `POST /api/auth/register` - Registrácia užívateľa
- `POST /api/auth/login` - Prihlásenie užívateľa
- `POST /api/auth/logout` - Odhlásenie
- `POST /api/auth/verify-email` - Verifikácia emailu

### Rezervácie
- `GET /api/bookings` - Zoznam rezervácií
- `POST /api/bookings` - Vytvorenie rezervácie
- `PUT /api/bookings/:id` - Úprava rezervácie
- `DELETE /api/bookings/:id` - Zrušenie rezervácie

### Permanentky
- `GET /api/season-tickets` - Zoznam permanentiek
- `POST /api/season-tickets/purchase` - Nákup permanentky
- `GET /api/season-tickets/user/:userId` - Užívateľské permanentky

### Platby
- `POST /api/payments/create-intent` - Vytvorenie platobného intentu
- `POST /api/payments/confirm` - Potvrdenie platby
- `POST /api/payments/refund` - Refundácia platby

## 🧪 Testovanie

### Frontend Testy
```bash
# Spustenie všetkých testov
npm test

# Test coverage
npm test -- --coverage

# Testy v watch móde
npm test -- --watch
```

### Backend Testy
```bash
# Spustenie všetkých testov
npm test

# Test coverage
npm run test:coverage

# Testy v watch móde
npm run test:watch
```

## 📦 Deployment

### Production Build
```bash
# Frontend build
npm run build

# Backend build (ak je potrebné)
cd booking-backend
npm run build
```

### Docker Deployment
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables pre Production
- `NODE_ENV=production`
- `REACT_APP_API_URL=https://your-api-domain.com`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=production-secret`

## 🤝 Prispievanie

1. Forknite repozitár
2. Vytvorte feature branch (`git checkout -b feature/AmazingFeature`)
3. Commitnite vaše zmeny (`git commit -m 'Add some AmazingFeature'`)
4. Pushnite do branchu (`git push origin feature/AmazingFeature`)
5. Otvorte Pull Request

## 📝 Licencia

Tento projekt je licencovaný pod MIT licenciou - pozrite [LICENSE](LICENSE) súbor pre detaily.

## 📞 Kontakt

- **Email**: info@nitracik.sk
- **Web**: [www.nitracik.sk](https://www.nitracik.sk)
- **GitHub**: [Nitracik Repository](https://github.com/your-username/nitracik)

## 🙏 Poďakovanie

- React team za skvelý framework
- Stripe za spoľahlivú platobnú bránu
- Prisma team za moderné ORM
- Všetkým prispievateľom a testerom

---

**Nitracik** © 2025 - Všetky práva vyhradené