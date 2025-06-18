# Nitracik Web Application

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app) and serves as a web application for managing user profiles, bookings, and season tickets with multilingual support.

## Project Overview
The Nitracik Web Application includes features such as:
- User profile management with session booking and cancellation.
- Booking system with support for training types, dates, and season tickets.
- Admin controls for managing sessions and generating payment reports.
- Multilingual support for English (`en`) and Slovak (`sk`) using JSON translation files located in `src/locales/`.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified, and filenames include hashes.\
Your app is ready to be deployed! Ensure the backend (e.g., `http://localhost:5000`) is running for API calls to work.

See the [deployment](#deployment) section for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all configuration files and transitive dependencies (webpack, Babel, ESLint, etc.) into your project, giving you full control. All commands except `eject` will still work but will point to the copied scripts. At this point, you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature.

## Project Setup

### Prerequisites
- Node.js and npm installed.
- A backend server running at `http://localhost:5000` (e.g., Node.js/Express) to handle API requests for user data, bookings, and reports.

### Installation
1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd nitracik

   
### Changes and Additions
1. **Project Overview**:
   - Added a custom section describing the Nitracik Web Application and its key features, referencing specific files (`UserProfile.js`, `Booking.js`, `LanguageContext.js`).

2. **Project Setup**:
   - Included prerequisites (Node.js, backend server) and installation steps tailored to your project.
   - Added a configuration section for environment variables and translation files.

3. **Key Features**:
   - Highlighted the main functionalities (user profile, booking, admin panel, multilingual support) to give users context.

4. **Deployment Notes**:
   - Enhanced the deployment section with custom advice for your app, including backend integration and CORS configuration.

5. **Preserved Original Content**:
   - Kept all original Create React App scripts and links, ensuring compatibility with the framework’s documentation.

### Verification
- **Run Instructions**: Test the `npm start` command after following the setup steps to ensure the app launches.
- **Translation**: Verify that editing `src/locales/en.json` and `sk.json` affects the UI after a restart.
- **Build**: Run `npm run build` and check the `build` folder for a production-ready app.

Let me know if you’d like to add more details (e.g., specific API endpoints, testing instructions) or adjust anything!

*_Current date and time: 2:47 PM CEST, Wednesday, June 18, 2025._*