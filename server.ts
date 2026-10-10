import express, { Request, Response, NextFunction } from 'express';
import cookieSession from 'cookie-session';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  cookieSession({
    name: 'apex_quiz_session',
    keys: [process.env.SESSION_SECRET || 'apex-quiz-secret-key-development'],
    maxAge: 24 * 60 * 60 * 1000,
  }) as any
);

// Types & In-Memory Store
export type Role = 'ADMIN' | 'CREATOR' | 'PARTICIPANT';
export type QuizStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

export interface Question {
  id: number;
  quizId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
}

export interface Quiz {
  id: number;
  title: string;
  duration: number; // in minutes
  status: QuizStatus;
  creatorId: number;
  createdAt: Date;
}

export interface Result {
  id: number;
  participantId: number;
  quizId: number;
  score: number;
  totalQuestions: number;
  takenAt: Date;
}

// Data Store
let userIdSeq = 1;
let quizIdSeq = 1;
let questionIdSeq = 1;
let resultIdSeq = 1;

const users: Map<number, User> = new Map();
const quizzes: Map<number, Quiz> = new Map();
const questions: Map<number, Question> = new Map();
const results: Map<number, Result> = new Map();

// Seed initial users and quizzes matching Spring Boot DataInitializer
function initializeData() {
  const adminPasswordHash = bcrypt.hashSync(process.env.APP_ADMIN_PASSWORD || 'Admin@123', 10);
  const creatorPasswordHash = bcrypt.hashSync('Creator@123', 10);
  const participantPasswordHash = bcrypt.hashSync('Participant@123', 10);

  const admin: User = {
    id: userIdSeq++,
    name: process.env.APP_ADMIN_NAME || 'Platform Admin',
    email: process.env.APP_ADMIN_EMAIL || 'admin@quizplatform.local',
    passwordHash: adminPasswordHash,
    role: 'ADMIN',
    createdAt: new Date(),
  };
  users.set(admin.id, admin);

  const creator: User = {
    id: userIdSeq++,
    name: 'Ava Creator',
    email: 'creator@quizplatform.local',
    passwordHash: creatorPasswordHash,
    role: 'CREATOR',
    createdAt: new Date(),
  };
  users.set(creator.id, creator);

  const participant: User = {
    id: userIdSeq++,
    name: 'Noah Participant',
    email: 'participant@quizplatform.local',
    passwordHash: participantPasswordHash,
    role: 'PARTICIPANT',
    createdAt: new Date(),
  };
  users.set(participant.id, participant);

  const seedQuiz: Quiz = {
    id: quizIdSeq++,
    title: 'Spring Boot Fundamentals',
    duration: 10,
    status: 'APPROVED',
    creatorId: creator.id,
    createdAt: new Date(),
  };
  quizzes.set(seedQuiz.id, seedQuiz);

  questions.set(questionIdSeq, {
    id: questionIdSeq++,
    quizId: seedQuiz.id,
    questionText: 'Which annotation starts a Spring Boot application?',
    optionA: '@SpringBootApplication',
    optionB: '@EnableAutoConfig',
    optionC: '@RestController',
    optionD: '@Entity',
    correctOption: 'A',
  });

  questions.set(questionIdSeq, {
    id: questionIdSeq++,
    quizId: seedQuiz.id,
    questionText: 'Which starter provides Spring Security?',
    optionA: 'spring-boot-starter-web',
    optionB: 'spring-boot-starter-security',
    optionC: 'spring-boot-starter-data-jpa',
    optionD: 'spring-boot-starter-thymeleaf',
    correctOption: 'B',
  });

  questions.set(questionIdSeq, {
    id: questionIdSeq++,
    quizId: seedQuiz.id,
    questionText: 'What does JPA stand for?',
    optionA: 'Java Persistence API',
    optionB: 'Java Platform Adapter',
    optionC: 'JSON Processing API',
    optionD: 'Jakarta Page Assembly',
    correctOption: 'A',
  });
}

initializeData();

// Helper Functions
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hours}:${minutes}`;
}

// Current User & Flash Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const session = req.session;
  let currentUser: User | null = null;
  if (session && session.userId) {
    currentUser = users.get(session.userId) || null;
  }
  res.locals.currentUser = currentUser;

  // Flash messages
  if (session && session.flash) {
    res.locals.success = session.flash.success || null;
    res.locals.error = session.flash.error || null;
    delete session.flash;
  } else {
    res.locals.success = null;
    res.locals.error = null;
  }
  next();
});

function setFlash(req: Request, type: 'success' | 'error', message: string) {
  if (req.session) {
    req.session.flash = {
      ...(req.session.flash || {}),
      [type]: message,
    };
  }
}

// Auth Guards
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!res.locals.currentUser) {
    return res.redirect('/login');
  }
  next();
}

function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!res.locals.currentUser) {
      return res.redirect('/login');
    }
    if (!roles.includes(res.locals.currentUser.role)) {
      return res.status(403).render('error', { active: 'home' });
    }
    next();
  };
}

// Routes
// 1. Home
app.get('/', (req: Request, res: Response) => {
  res.render('index', { active: 'home' });
});

// 2. Authentication
app.get('/login', (req: Request, res: Response) => {
  if (res.locals.currentUser) {
    return res.redirect('/quizzes');
  }
  const error = req.query.error ? 'Invalid email or password.' : null;
  const logout = req.query.logout ? true : false;
  res.render('auth/login', { error, logout });
});

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const email = (username || '').trim().toLowerCase();

  const user = Array.from(users.values()).find((u) => u.email.toLowerCase() === email);
  if (!user || !bcrypt.compareSync(password || '', user.passwordHash)) {
    return res.redirect('/login?error=true');
  }

  if (req.session) {
    req.session.userId = user.id;
  }

  if (user.role === 'ADMIN') {
    return res.redirect('/admin/dashboard');
  } else if (user.role === 'CREATOR') {
    return res.redirect('/creator/dashboard');
  } else {
    return res.redirect('/quizzes');
  }
});

app.get('/register', (req: Request, res: Response) => {
  if (res.locals.currentUser) {
    return res.redirect('/quizzes');
  }
  res.render('auth/register', { user: null });
});

app.post('/register', (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  const trimmedEmail = (email || '').trim().toLowerCase();
  const trimmedName = (name || '').trim();

  if (!trimmedName || !trimmedEmail || !password) {
    return res.render('auth/register', {
      error: 'All fields are required.',
      user: { name: trimmedName, email: trimmedEmail, role },
    });
  }

  if (password.length < 6) {
    return res.render('auth/register', {
      error: 'Password must be at least 6 characters.',
      user: { name: trimmedName, email: trimmedEmail, role },
    });
  }

  const existing = Array.from(users.values()).find((u) => u.email.toLowerCase() === trimmedEmail);
  if (existing) {
    return res.render('auth/register', {
      error: 'An account with that email address already exists.',
      user: { name: trimmedName, email: trimmedEmail, role },
    });
  }

  const validRole: Role = role === 'CREATOR' ? 'CREATOR' : 'PARTICIPANT';
  const newUser: User = {
    id: userIdSeq++,
    name: trimmedName,
    email: trimmedEmail,
    passwordHash: bcrypt.hashSync(password, 10),
    role: validRole,
    createdAt: new Date(),
  };
  users.set(newUser.id, newUser);

  setFlash(req, 'success', 'Account created. Sign in to continue.');
  res.redirect('/login');
});

app.post('/logout', (req: Request, res: Response) => {
  if (req.session) {
    req.session = null;
  }
  res.redirect('/login?logout=true');
});

// 3. Admin Routes
app.get(['/admin', '/admin/dashboard'], requireRole('ADMIN'), (req: Request, res: Response) => {
  const allUsers = Array.from(users.values());
  const allQuizzes = Array.from(quizzes.values());
  const allResults = Array.from(results.values());

  const userCount = allUsers.length;
  const pendingCount = allQuizzes.filter((q) => q.status === 'PENDING').length;
  const approvedCount = allQuizzes.filter((q) => q.status === 'APPROVED').length;
  const resultCount = allResults.length;

  res.render('admin/dashboard', {
    active: 'admin',
    userCount,
    pendingCount,
    approvedCount,
    resultCount,
  });
});

app.get('/admin/users', requireRole('ADMIN'), (req: Request, res: Response) => {
  const userList = Array.from(users.values());
  res.render('admin/users', { active: 'admin', users: userList });
});

app.post('/admin/users/delete/:id', requireRole('ADMIN'), (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const targetUser = users.get(id);

  if (targetUser) {
    if (targetUser.role === 'ADMIN') {
      const adminCount = Array.from(users.values()).filter((u) => u.role === 'ADMIN').length;
      if (adminCount <= 1) {
        setFlash(req, 'error', 'The last admin account cannot be deleted.');
        return res.redirect('/admin/users');
      }
    }
    users.delete(id);
    setFlash(req, 'success', 'User removed.');
  }

  res.redirect('/admin/users');
});

app.get('/admin/quizzes', requireRole('ADMIN'), (req: Request, res: Response) => {
  const quizList = Array.from(quizzes.values()).map((q) => ({
    ...q,
    creator: users.get(q.creatorId) || null,
  }));
  res.render('admin/quizzes', { active: 'admin', quizzes: quizList });
});

app.post('/admin/quizzes/approve/:id', requireRole('ADMIN'), (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const quiz = quizzes.get(id);
  if (quiz) {
    quiz.status = 'APPROVED';
    setFlash(req, 'success', 'Quiz approved and published.');
  }
  res.redirect('/admin/quizzes');
});

app.post('/admin/quizzes/reject/:id', requireRole('ADMIN'), (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const quiz = quizzes.get(id);
  if (quiz) {
    quiz.status = 'REJECTED';
    setFlash(req, 'success', 'Quiz rejected.');
  }
  res.redirect('/admin/quizzes');
});

// 4. Creator Routes
app.get('/creator/dashboard', requireRole('CREATOR', 'ADMIN'), (req: Request, res: Response) => {
  const creator = res.locals.currentUser as User;
  const creatorQuizzes = Array.from(quizzes.values()).filter((q) => q.creatorId === creator.id);

  const quizCount = creatorQuizzes.length;
  const pendingCount = creatorQuizzes.filter((q) => q.status === 'PENDING').length;
  const approvedCount = creatorQuizzes.filter((q) => q.status === 'APPROVED').length;

  res.render('creator/dashboard', {
    active: 'creator',
    quizCount,
    pendingCount,
    approvedCount,
  });
});

app.get('/creator/quizzes', requireRole('CREATOR', 'ADMIN'), (req: Request, res: Response) => {
  const creator = res.locals.currentUser as User;
  const creatorQuizzes = Array.from(quizzes.values()).filter((q) => q.creatorId === creator.id);
  res.render('creator/my-quizzes', { active: 'creator', quizzes: creatorQuizzes });
});

app.get('/creator/quizzes/create', requireRole('CREATOR', 'ADMIN'), (req: Request, res: Response) => {
  res.render('creator/create-quiz', { active: 'creator' });
});

app.post('/creator/quizzes/create', requireRole('CREATOR', 'ADMIN'), (req: Request, res: Response) => {
  const creator = res.locals.currentUser as User;
  const title = (req.body.title || '').trim();
  const duration = Math.max(1, Number(req.body.duration) || 15);

  const newQuiz: Quiz = {
    id: quizIdSeq++,
    title: title || 'Untitled Quiz',
    duration,
    status: 'PENDING',
    creatorId: creator.id,
    createdAt: new Date(),
  };
  quizzes.set(newQuiz.id, newQuiz);

  res.redirect(`/creator/quizzes/${newQuiz.id}/add-questions`);
});

app.get('/creator/quizzes/:quizId/add-questions', requireRole('CREATOR', 'ADMIN'), (req: Request, res: Response) => {
  const quizId = Number(req.params.quizId);
  const quiz = quizzes.get(quizId);
  if (!quiz) {
    return res.redirect('/creator/quizzes');
  }

  const quizQuestions = Array.from(questions.values()).filter((q) => q.quizId === quizId);
  res.render('creator/add-question', {
    active: 'creator',
    quiz,
    questions: quizQuestions,
  });
});

app.post('/creator/quizzes/:quizId/add-questions', requireRole('CREATOR', 'ADMIN'), (req: Request, res: Response) => {
  const quizId = Number(req.params.quizId);
  const quiz = quizzes.get(quizId);
  if (!quiz) {
    return res.redirect('/creator/quizzes');
  }

  const { questionText, optionA, optionB, optionC, optionD, correctoption } = req.body;
  const newQuestion: Question = {
    id: questionIdSeq++,
    quizId,
    questionText: questionText.trim(),
    optionA: optionA.trim(),
    optionB: optionB.trim(),
    optionC: optionC.trim(),
    optionD: optionD.trim(),
    correctOption: correctoption.trim().toUpperCase(),
  };
  questions.set(newQuestion.id, newQuestion);

  setFlash(req, 'success', 'Question added.');
  res.redirect(`/creator/quizzes/${quizId}/add-questions`);
});

// 5. Participant Routes
app.get('/quizzes', requireAuth, (req: Request, res: Response) => {
  const approvedQuizzes = Array.from(quizzes.values())
    .filter((q) => q.status === 'APPROVED')
    .map((q) => ({
      ...q,
      creator: users.get(q.creatorId) || null,
    }));

  res.render('participant/quiz-list', { active: 'quizzes', quizzes: approvedQuizzes });
});

app.get('/quizzes/:id/take', requireAuth, (req: Request, res: Response) => {
  const quizId = Number(req.params.id);
  const quiz = quizzes.get(quizId);
  if (!quiz || quiz.status !== 'APPROVED') {
    return res.redirect('/quizzes');
  }

  const quizQuestions = Array.from(questions.values()).filter((q) => q.quizId === quizId);
  if (quizQuestions.length === 0) {
    return res.redirect('/quizzes');
  }

  res.render('participant/take-quiz', {
    active: 'quizzes',
    quiz: {
      ...quiz,
      questions: quizQuestions,
    },
  });
});

app.post('/quizzes/:id/submit', requireAuth, (req: Request, res: Response) => {
  const quizId = Number(req.params.id);
  const quiz = quizzes.get(quizId);
  const user = res.locals.currentUser as User;

  if (!quiz) {
    return res.redirect('/quizzes');
  }

  const quizQuestions = Array.from(questions.values()).filter((q) => q.quizId === quizId);
  let score = 0;

  for (const q of quizQuestions) {
    const selected = req.body[`question_${q.id}`];
    if (selected && selected.toUpperCase() === q.correctOption.toUpperCase()) {
      score++;
    }
  }

  const newResult: Result = {
    id: resultIdSeq++,
    participantId: user.id,
    quizId: quiz.id,
    score,
    totalQuestions: quizQuestions.length,
    takenAt: new Date(),
  };
  results.set(newResult.id, newResult);

  res.render('participant/quiz-result', {
    active: 'quizzes',
    quiz,
    score,
    totalQuestions: quizQuestions.length,
  });
});

app.get('/participant/history', requireAuth, (req: Request, res: Response) => {
  const user = res.locals.currentUser as User;
  const userResults = Array.from(results.values())
    .filter((r) => r.participantId === user.id)
    .sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime())
    .map((r) => ({
      ...r,
      quiz: quizzes.get(r.quizId) || null,
      formattedDate: formatDate(r.takenAt),
    }));

  res.render('participant/history', { active: 'history', results: userResults });
});

// Error handling
app.use((req: Request, res: Response) => {
  res.status(404).render('error', { active: 'home' });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).render('error', { active: 'home' });
});

// Start Server
app.listen(PORT, HOST, () => {
  console.log(`Apex Quiz server running at http://${HOST}:${PORT}`);
});
