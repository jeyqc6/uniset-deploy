
# UniNest: Real-Time Roommate Matching & Chat Platform

**UniNest** is a full-stack real-time communication system designed for roommate discovery and housing communities. Built with **FastAPI** (backend), **PostgreSQL** (database), and **React** (frontend via Vite), it supports user authentication, chat rooms, WebSocket-based messaging, and AI-enhanced persona analysis.
[Watch the demo video on YouTube](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

---

## 📁 Project Structure

```
uninest-revise/
├── backend/           # FastAPI backend
│   ├── app/           # Core modules (models, schemas, API, logic)
│   ├── alembic/       # Database migrations
│   └── requirements.txt
├── frontend/          # React frontend (Vite or Next.js)
│   ├── src/
│   └── package.json
└── README.md
```

---

## Recommendation logic:
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Input    │────►│  Auth Service   │────►│  User Profile   │
│   & Request     │     │  Verification   │     │  Retrieval      │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User/Property  │     │ User Preference │     │  Tenant/Landlord│
│    Database     │◄───►│    Extraction   │◄────│  Profile Check  │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Score Calculator│     │Feature Matching │     │ Property/User   │
│ PROPERTY:       │     │ROOMMATE:        │     │   Collection    │
│ • Budget (30%)  │────►│ • Budget (30%)  │────►│                 │
│ • Location (30%)│     │ • Location (30%)│     │                 │
│ • Type (20%)    │     │ • Lifestyle(40%)│     │                 │
│ • Bed/Bath (20%)│     │                 │     │                 │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
        │                                                │
        └────────────────────┬───────────────────────────┘
                             │
                             ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Sort Results   │     │ Top-N Selection │     │   API Response  │
│  by Score       │────►│ (Limit Filter)  │────►│   Formatting    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```
---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourname/uninest-revise.git
cd uninest-revise
```

### 2. Backend Setup (FastAPI)

#### 2.1 Install Dependencies

We recommend using a virtual environment

```bash
cd backend
pip install -r requirements.txt
```

#### 2.2 Configure Environment

Edit `backend/.env`:

```env
DATABASE_URL
SECRET_KEY
ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES


AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
S3_BUCKET_NAME

OPENAI_API_KEY
```

#### 2.3 Initialize Database

Make sure PostgreSQL is running and create the database:

```bash
createdb uninest
alembic upgrade head
```

#### 2.4 Run the Server

```bash
uvicorn app.main:app --reload
```

Available at: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

### 3. Frontend Setup (Vite)

#### 3.1 Install Frontend Dependencies

```bash
cd ../frontend/housing-web
npm install
```

#### 3.2 Configure Environment

Edit `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

#### 3.3 Run Frontend

```bash
npm run dev
```

Runs on [http://localhost:5173](http://localhost:5173) (Vite) 

---

## Tech Stack

### Frontend

* **Vite (React Framework)**
* **TypeScript**
* **Tailwind CSS** (with PostCSS)

### Backend

* **Python 3.9**
* **FastAPI** (RESTful backend)
* **PostgreSQL + SQLAlchemy (async)**
* **WebSockets (FastAPI real-time messaging)**

### AI / ML Components

* **PyTorch** (model hosting)
* **Transformers (Hugging Face)** – for language processing
* **CLIP** – for image-audio-text semantic search
* **NumPy / SciPy** – vector calculations and embeddings

---

##  Features

*  JWT-based Auth (Login / Signup)
*  AI-driven persona report generation (OpenAI integration)
*  Real-time WebSocket chat
*  Image preference selection + CLIP semantic matching
*  Profile dashboard and data commodification satire (easter egg)
*  Modern, mobile-first UI

---

## Sample Commands

```bash
# Backend
cd backend
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev
```


