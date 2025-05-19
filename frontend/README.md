

# UniNest Frontend

A frontend project built with **Vite + React**, powering the user interface and real-time chat functionality for UniNest — a roommate matching and messaging platform.

---

##  Tech Stack

* **Vite** – Fast build tool
* **React** – UI library
* **React Router** – Client-side routing
* **WebSocket** – Real-time communication
* **Tailwind CSS** – Utility-first CSS framework

---

## 📁 Project Structure

```
frontend/housing-web
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-based page components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API utilities
│   ├── utils/          # Utility functions
│   ├── context/        # React Context providers
│   ├── assets/         # Static assets
│   └── App.jsx         # Root component
├── .env                # Environment variables
├── index.html          # HTML template
├── package.json        # Project dependencies
└── vite.config.js      # Vite configuration
```

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file at the project root:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 3. Start the Development Server

```bash
npm run dev
```

Visit the app at `http://localhost:5173`.

---

##  Key Features

### User Authentication

* Sign up / Sign in
* JWT token handling
* Route protection

### Real-Time Chat

* WebSocket-based messaging
* Message history persistence
* Online status indicators

### Roommate Matching

* Profile management
* Matching logic
* Optional geolocation integration

---

##  Development Notes

### Accessing Environment Variables

Use `import.meta.env` to access Vite environment variables:

```js
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

### WebSocket Integration

Manage real-time connections via a custom React hook:

```js
const { messages, sendMessage } = useWebSocket(userId, token);
```

### API Requests

Use an `axios` instance for backend communication:

```js
import api from '@/services/api';

const sendMessage = async (message) => {
  try {
    const res = await api.post('/messages', message);
    return res.data;
  } catch (err) {
    console.error('Message send failed:', err);
  }
};
```

---

##  Troubleshooting

### WebSocket Connection Fails

* Check if token is passed correctly
* Ensure backend WebSocket server is running
* Validate CORS configuration

### Environment Variables Not Working

* All variables must start with `VITE_`
* Restart the dev server after editing `.env`
* Make sure `.env` is in the root directory

### Duplicate Requests in Dev

* React.StrictMode causes double renders
* Use `useRef` to prevent multiple WebSocket connections
* Use correct dependency arrays in `useEffect`

---

##  Build & Deploy

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

Compiled files will be output to the `dist` directory.


---

##  Code Style

* Code linting via **ESLint**
* Code formatting with **Prettier**
* React best practices: functional components + Hooks

