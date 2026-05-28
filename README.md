# AI Assessment Creator

An intelligent assessment creation system that enables teachers to generate question papers using AI. The system features real-time updates, structured output display, and PDF export capabilities.

## 🚀 Features

- **Assignment Creation**: Create assignments with customizable parameters including question types, number of questions, marks, and due dates
- **AI-Powered Generation**: Leverages GPT-4 to generate structured question papers with multiple sections
- **Real-time Updates**: WebSocket integration for live status updates during generation
- **Structured Output**: Beautifully formatted question papers with sections, difficulty badges, and marks
- **PDF Export**: Download question papers as properly formatted PDFs
- **Background Processing**: BullMQ for efficient job queue management
- **State Management**: Zustand for efficient frontend state management
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS

## 🏗️ Architecture

### Frontend (Next.js + TypeScript)
- **Framework**: Next.js 14 with App Router
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io Client
- **PDF Generation**: Browser print functionality

### Backend (Node.js + Express + TypeScript)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Cache**: Redis
- **Job Queue**: BullMQ
- **Real-time**: Socket.io
- **AI Integration**: OpenAI GPT-4

### System Flow
1. User creates assignment via frontend form
2. Assignment data sent to backend API
3. Job added to BullMQ queue
4. Worker processes job using AI to generate questions
5. Results stored in MongoDB
6. WebSocket notifies frontend of completion
7. User views generated question paper

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- Redis (v7 or higher)
- OpenAI API Key

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd internship
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Environment Configuration

Create `.env` files in both frontend and backend directories:

**Backend (backend/.env)**:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/ai-assessment
REDIS_HOST=localhost
REDIS_PORT=6379
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

**Frontend (frontend/.env)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 4. Start Services

**Start MongoDB**:
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or locally if installed
mongod
```

**Start Redis**:
```bash
# Using Docker
docker run -d -p 6379:6379 --name redis redis:latest

# Or locally if installed
redis-server
```

### 5. Run the Application

**Option 1: Run both frontend and backend together**:
```bash
# From root directory
npm run dev
```

**Option 2: Run separately**:

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Worker):
```bash
cd backend
npm run worker
```

Terminal 3 (Frontend):
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## 📁 Project Structure

```
internship/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Home page
│   │   │   ├── layout.tsx            # Root layout
│   │   │   ├── globals.css           # Global styles
│   │   │   └── assignment/
│   │   │       └── [id]/
│   │   │           └── page.tsx      # Assignment detail page
│   │   ├── components/
│   │   │   ├── AssignmentForm.tsx    # Assignment creation form
│   │   │   ├── AssignmentList.tsx    # List of assignments
│   │   │   └── QuestionPaperView.tsx # Question paper display
│   │   └── store/
│   │       └── useAssignmentStore.ts # Zustand store
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.js
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts           # MongoDB connection
│   │   │   └── redis.ts              # Redis & BullMQ config
│   │   ├── models/
│   │   │   └── Assignment.ts         # Assignment schema
│   │   ├── routes/
│   │   │   └── assignments.ts        # API routes
│   │   ├── services/
│   │   │   └── aiGenerator.ts        # AI generation logic
│   │   ├── server.ts                 # Express server
│   │   └── worker.ts                 # BullMQ worker
│   ├── package.json
│   └── tsconfig.json
├── package.json                      # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Assignments

- `POST /api/assignments` - Create new assignment
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/:id` - Get single assignment
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment
- `POST /api/assignments/:id/regenerate` - Regenerate question paper

### WebSocket Events

- `join-assignment` - Join assignment room for updates
- `assignment-status` - Receive status updates

## 🎨 Usage

### Creating an Assignment

1. Navigate to the home page
2. Fill in the assignment form:
   - Title and subject
   - Due date
   - Question types (select from dropdown)
   - Number of questions
   - Marks per question
   - Additional instructions
   - Optional reference material upload
3. Click "Generate Question Paper"
4. Wait for AI to generate the paper (real-time updates)
5. View the generated question paper

### Viewing Question Papers

1. Click on any assignment from the list
2. View the structured question paper with:
   - Student info section
   - Multiple sections (A, B, C, etc.)
   - Questions with difficulty badges
   - Marks distribution
3. Download as PDF using the download button
4. Regenerate if needed using the regenerate button

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Backend server port | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `REDIS_HOST` | Redis host | Yes |
| `REDIS_PORT` | Redis port | Yes |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | Yes |
| `NEXT_PUBLIC_WS_URL` | Frontend WebSocket URL | Yes |

## 🧪 Testing

```bash
# Run backend tests (if configured)
cd backend
npm test

# Run frontend tests (if configured)
cd frontend
npm test
```

## 🚀 Production Deployment

### Backend

1. Build the TypeScript:
```bash
cd backend
npm run build
```

2. Start the production server:
```bash
npm start
```

3. Start the worker:
```bash
npm run worker
```

### Frontend

1. Build the Next.js app:
```bash
cd frontend
npm run build
```

2. Start the production server:
```bash
npm start
```

### Docker Deployment (Optional)

Create `docker-compose.yml` for easy deployment:

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
  
  redis:
    image: redis:latest
    ports:
      - "6379:6379"
  
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    depends_on:
      - mongodb
      - redis
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/ai-assessment
      - REDIS_HOST=redis
      - REDIS_PORT=6379
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

## 🎯 Bonus Features Implemented

- ✅ PDF download with proper formatting
- ✅ Difficulty badges with color coding (Easy/Medium/Hard)
- ✅ Real-time WebSocket updates
- ✅ Responsive mobile design
- ✅ Clean, exam-paper-like layout
- ✅ Regenerate functionality
- ✅ Form validation with error messages
- ✅ Loading states and progress indicators

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Next.js team for the amazing framework
- BullMQ for job queue management
- Socket.io for real-time communication
