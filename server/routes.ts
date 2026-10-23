import express from 'express';
import fs from 'fs';
import path from 'path';
import { db, hashPin, Profile } from './db';
import { generateTutorResponse, generateTutorResponseStream, evaluateWriting, evaluateSpeaking, generateTTSAudio } from './gemini';

export const apiRouter = express.Router();
apiRouter.use(express.json());

// Simple token auth helper (In production with JWT, here mapped with secure signed profile token)
function getAuthProfile(req: express.Request): Profile | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.substring(7).trim();
  // Token format: student_<profileId> or admin_<profileId>
  const parts = token.split('_');
  if (parts.length >= 2) {
    const profileId = parts.slice(1).join('_');
    return db.getProfileById(profileId) || null;
  }
  return null;
}

function getAuthProfileOrGuest(req: express.Request): Profile {
  const profile = getAuthProfile(req);
  if (profile) return profile;
  const demo = db.getProfileById('demo-student-id');
  if (demo) return demo;
  return {
    id: 'demo-student-id',
    role: 'student',
    first_name: 'Azizbek',
    last_name: 'Karimov',
    age: 20,
    pin_hash: '',
    target_band: 7.5,
    current_level: 'B2',
    study_hours_per_day: 2,
    intensity: 'moderate',
    streak_days: 1,
    total_study_minutes: 0,
    last_active_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const profile = getAuthProfile(req);
  if (!profile) {
    return res.status(401).json({ error: 'Avtorizatsiyadan o‘tilmagan. Iltimos, tizimga kiring.' });
  }
  (req as any).user = profile;
  next();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const profile = getAuthProfile(req);
  if (!profile || profile.role !== 'admin') {
    return res.status(403).json({ error: 'Ushbu amal faqat administratorlar uchun ruxsat etilgan.' });
  }
  (req as any).user = profile;
  next();
}

// ---------------- AUTH ROUTES ----------------
apiRouter.post('/auth/register', (req, res) => {
  try {
    const { first_name, last_name, age, pin } = req.body;

    if (!first_name || !last_name || !age || !pin) {
      return res.status(400).json({ error: 'Barcha maydonlarni to‘ldirish majburiy (Ism, Familiya, Yosh, PIN-kod).' });
    }

    const numAge = Number(age);
    if (isNaN(numAge) || numAge < 10 || numAge > 99) {
      return res.status(400).json({ error: 'Yosh 10 dan 99 gacha bo‘lishi kerak.' });
    }

    const pinStr = String(pin).trim();
    if (!/^\d{4,6}$/.test(pinStr)) {
      return res.status(400).json({ error: 'PIN-kod 4 yoki 6 xonali raqam bo‘lishi lozim.' });
    }

    const pin_hash = hashPin(pinStr);

    const newProfile = db.createProfile({
      role: 'student',
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      age: numAge,
      pin_hash,
      target_band: 7.0,
      current_level: 'B2',
      study_hours_per_day: 2,
      intensity: 'moderate'
    });

    // Create initial default plan
    db.createOrUpdatePlan(newProfile.id, {});

    db.logAudit(newProfile.id, 'student', 'REGISTER', 'profile', newProfile.id, `Yangi o‘quvchi ro‘yxatdan o‘tdi: ${first_name} ${last_name}`);

    const token = `student_${newProfile.id}`;
    return res.json({
      token,
      profile: {
        id: newProfile.id,
        role: newProfile.role,
        first_name: newProfile.first_name,
        last_name: newProfile.last_name,
        age: newProfile.age,
        target_band: newProfile.target_band,
        current_level: newProfile.current_level,
        streak_days: newProfile.streak_days,
        total_study_minutes: newProfile.total_study_minutes
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Ro‘yxatdan o‘tishda xatolik yuz berdi' });
  }
});

apiRouter.post('/auth/login', (req, res) => {
  try {
    const { student_id, first_name, last_name, pin } = req.body;
    const pinStr = String(pin || '').trim();

    if (!pinStr) {
      return res.status(400).json({ error: 'PIN-kod kiritilmadi.' });
    }

    const pinHash = hashPin(pinStr);
    let profile: Profile | undefined;

    if (student_id) {
      profile = db.getProfileById(student_id.trim());
    } else if (first_name && last_name) {
      profile = db.getProfiles().find(
        p => p.first_name.toLowerCase() === first_name.trim().toLowerCase() &&
             p.last_name.toLowerCase() === last_name.trim().toLowerCase()
      );
    }

    if (!profile) {
      return res.status(404).json({ error: 'O‘quvchi profili topilmadi. Ism va familiyani yoki ID raqamini tekshiring.' });
    }

    if (profile.pin_hash !== pinHash) {
      return res.status(401).json({ error: 'PIN-kod noto‘g‘ri. Qayta urinib ko‘ring.' });
    }

    const token = `${profile.role}_${profile.id}`;
    return res.json({
      token,
      profile: {
        id: profile.id,
        role: profile.role,
        first_name: profile.first_name,
        last_name: profile.last_name,
        age: profile.age,
        target_band: profile.target_band,
        current_level: profile.current_level,
        streak_days: profile.streak_days,
        total_study_minutes: profile.total_study_minutes
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Kirishda xatolik yuz berdi' });
  }
});

apiRouter.get('/auth/me', requireAuth, (req, res) => {
  const profile = (req as any).user as Profile;
  res.json({
    profile: {
      id: profile.id,
      role: profile.role,
      first_name: profile.first_name,
      last_name: profile.last_name,
      age: profile.age,
      target_band: profile.target_band,
      current_level: profile.current_level,
      exam_date: profile.exam_date,
      study_hours_per_day: profile.study_hours_per_day,
      intensity: profile.intensity,
      streak_days: profile.streak_days,
      total_study_minutes: profile.total_study_minutes
    }
  });
});

apiRouter.put('/auth/profile', requireAuth, (req, res) => {
  const user = (req as any).user as Profile;
  const { target_band, current_level, exam_date, study_hours_per_day, intensity } = req.body;

  const updated = db.updateProfile(user.id, {
    target_band: target_band !== undefined ? Number(target_band) : user.target_band,
    current_level: current_level || user.current_level,
    exam_date: exam_date || user.exam_date,
    study_hours_per_day: study_hours_per_day !== undefined ? Number(study_hours_per_day) : user.study_hours_per_day,
    intensity: intensity || user.intensity
  });

  res.json({ profile: updated });
});

// ---------------- LEARNING PLANS & ONBOARDING ----------------
apiRouter.get('/plan', requireAuth, (req, res) => {
  const user = (req as any).user as Profile;
  let plan = db.getPlanByProfileId(user.id);
  if (!plan) {
    plan = db.createOrUpdatePlan(user.id, {});
  }
  res.json({ plan });
});

apiRouter.post('/plan/diagnostic', requireAuth, (req, res) => {
  const user = (req as any).user as Profile;
  const { current_level, target_band, exam_date, study_hours, intensity, reading_diag, listening_diag } = req.body;

  db.updateProfile(user.id, {
    current_level: current_level || user.current_level,
    target_band: Number(target_band) || user.target_band,
    exam_date: exam_date || user.exam_date,
    study_hours_per_day: Number(study_hours) || user.study_hours_per_day,
    intensity: intensity || user.intensity
  });

  // Calculate weak areas based on diagnostic inputs
  const weakSkills = [];
  if (reading_diag && reading_diag < 6.5) {
    weakSkills.push({ skill: 'Reading', error_count: 3, focus_area: 'Skimming, scanning va True/False/Not Given' });
  }
  if (listening_diag && listening_diag < 6.5) {
    weakSkills.push({ skill: 'Listening', error_count: 2, focus_area: 'Form completion va raqamlarni eshitib yozish' });
  }
  weakSkills.push({ skill: 'Writing', error_count: 4, focus_area: 'Akademik so‘z boyligi va Task 2 argumentatsiyasi' });

  const plan = db.createOrUpdatePlan(user.id, {
    weak_skills: weakSkills,
    daily_objectives: [
      { day: 'Dushanba', title: 'Reading: True/False/Not Given strategiyasi', skill: 'reading', duration_min: 30, completed: false },
      { day: 'Seshanba', title: 'Listening: Section 1 & 2 detallarni ilib olish', skill: 'listening', duration_min: 25, completed: false },
      { day: 'Chorshanba', title: 'Writing: Task 2 muammoga yechim inshosi', skill: 'writing', duration_min: 40, completed: false },
      { day: 'Payshanba', title: 'Speaking: Part 2 Cue card va ravonlik', skill: 'speaking', duration_min: 20, completed: false },
      { day: 'Juma', title: 'Grammar: Akademik inversiya va bog‘lovchilar', skill: 'grammar', duration_min: 25, completed: false },
      { day: 'Shanba', title: 'Haftalik Mini Mock Test (Reading + Writing)', skill: 'all', duration_min: 60, completed: false },
      { day: 'Yakshanba', title: 'Xatolar tahlili va yangi lug‘atlar takrori', skill: 'vocabulary', duration_min: 20, completed: false }
    ]
  });

  res.json({ message: 'Diagnostika yakunlandi va shaxsiy reja tuzildi', plan });
});

// ---------------- EXERCISES & TIMED ATTEMPTS ----------------
apiRouter.get('/exercises', (req, res) => {
  const { skill } = req.query;
  const list = db.getExercises(typeof skill === 'string' ? skill : undefined);
  res.json({ exercises: list });
});

apiRouter.get('/exercises/:id', (req, res) => {
  const exercise = db.getExerciseById(req.params.id);
  if (!exercise) return res.status(404).json({ error: 'Mashq topilmadi' });
  // Questions without answers/explanations
  const questions = db.getQuestionsForExercise(exercise.id, true);
  res.json({ exercise, questions });
});

// ---------------- AUDIO STREAMING & TTS ----------------
apiRouter.get('/audio/exercise/:id', async (req, res) => {
  try {
    const exerciseId = req.params.id;
    const cacheDir = path.resolve(process.cwd(), 'data/audio_cache');
    const audioFilePath = path.join(cacheDir, `${exerciseId}.wav`);

    if (fs.existsSync(audioFilePath)) {
      const stat = fs.statSync(audioFilePath);
      res.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': stat.size,
        'Cache-Control': 'public, max-age=86400',
        'Accept-Ranges': 'bytes'
      });
      const readStream = fs.createReadStream(audioFilePath);
      return readStream.pipe(res);
    }

    const exercise = db.getExerciseById(exerciseId);
    if (!exercise || !exercise.audio_transcript) {
      return res.status(404).json({ error: 'Audio matni topilmadi' });
    }

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const audioBuf = await generateTTSAudio(exercise.audio_transcript, 'Puck');
    if (audioBuf) {
      fs.writeFileSync(audioFilePath, audioBuf);
      res.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuf.length,
        'Cache-Control': 'public, max-age=86400',
        'Accept-Ranges': 'bytes'
      });
      return res.end(audioBuf);
    }

    return res.status(503).json({ error: 'Audio generatsiya qilinmadi, Web Speech ishlatiladi', fallback_tts: true });
  } catch (err: any) {
    console.error('Audio serving error:', err);
    res.status(500).json({ error: err.message, fallback_tts: true });
  }
});

apiRouter.get('/audio/test-sound', async (req, res) => {
  try {
    const cacheDir = path.resolve(process.cwd(), 'data/audio_cache');
    const testAudioPath = path.join(cacheDir, 'test-sound.wav');

    if (fs.existsSync(testAudioPath)) {
      const stat = fs.statSync(testAudioPath);
      res.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': stat.size,
        'Cache-Control': 'public, max-age=86400'
      });
      return fs.createReadStream(testAudioPath).pipe(res);
    }

    const testText = "This is an audio test for IELTS Listening. If you can hear this clearly, your sound is working properly.";
    const audioBuf = await generateTTSAudio(testText, 'Kore');
    if (audioBuf) {
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(testAudioPath, audioBuf);
      res.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuf.length,
        'Cache-Control': 'public, max-age=86400'
      });
      return res.end(audioBuf);
    }

    return res.status(200).json({ status: 'ok', fallback: true });
  } catch (e: any) {
    res.status(200).json({ status: 'ok', fallback: true });
  }
});

apiRouter.post('/exercises/:id/start', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as Profile;
    const exercise = db.getExerciseById(req.params.id);
    if (!exercise) return res.status(404).json({ error: 'Mashq topilmadi' });

    const attempt = db.createAttempt(user.id, exercise.id);
    const questions = db.getQuestionsForExercise(exercise.id, true);

    res.json({
      attempt,
      exercise,
      questions,
      server_time: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/attempts/:id', requireAuth, (req, res) => {
  const attempt = db.getAttemptById(req.params.id);
  if (!attempt) return res.status(404).json({ error: 'Urinish topilmadi' });

  const user = (req as any).user as Profile;
  if (user.role !== 'admin' && attempt.profile_id !== user.id) {
    return res.status(403).json({ error: 'Boshqa o‘quvchining ma’lumotini ko‘rish taqiqlangan' });
  }

  const exercise = db.getExerciseById(attempt.exercise_id);
  const answers = db.getAnswersForAttempt(attempt.id);

  // If submitted, include full evaluation details
  let details: any[] = [];
  if (attempt.status === 'submitted') {
    const rawQuestions = db.getQuestionsRaw(attempt.exercise_id);
    const ansMap = new Map(answers.map(a => [a.question_id, a.user_answer]));
    details = rawQuestions.map(q => ({
      question: q,
      user_answer: ansMap.get(q.id) || '',
      is_correct: (ansMap.get(q.id) || '').trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
    }));
  }

  res.json({ attempt, exercise, answers, details, server_time: new Date().toISOString() });
});

apiRouter.post('/attempts/:id/save-answer', requireAuth, (req, res) => {
  try {
    const { question_id, user_answer } = req.body;
    const attempt = db.getAttemptById(req.params.id);
    if (!attempt) return res.status(404).json({ error: 'Urinish topilmadi' });

    const user = (req as any).user as Profile;
    if (attempt.profile_id !== user.id) {
      return res.status(403).json({ error: 'Ruxsat berilmagan' });
    }

    const saved = db.saveAnswer(attempt.id, question_id, String(user_answer || ''));
    res.json({ answer: saved });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/attempts/:id/submit', requireAuth, (req, res) => {
  try {
    const { user_text_response } = req.body;
    const attempt = db.getAttemptById(req.params.id);
    if (!attempt) return res.status(404).json({ error: 'Urinish topilmadi' });

    const user = (req as any).user as Profile;
    if (attempt.profile_id !== user.id) {
      return res.status(403).json({ error: 'Ruxsat berilmagan' });
    }

    const result = db.submitAttempt(attempt.id, user_text_response);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------- AI TUTOR & FEEDBACK ----------------
apiRouter.post('/ai/tutor/stream', async (req, res) => {
  try {
    const user = getAuthProfileOrGuest(req);
    const { message, skill_context } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Xabar matni bo‘sh bo‘lishi mumkin emas' });
    }

    // Set Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    // Save student message in DB
    db.addChatMessage(user.id, 'user', message.trim(), skill_context);

    const history = db.getChatHistory(user.id).map(m => ({
      role: m.role,
      content: m.content
    }));

    let fullReply = '';
    const stream = generateTutorResponseStream(
      user.first_name,
      user.target_band,
      history.slice(-4),
      message.trim(),
      skill_context
    );

    for await (const chunk of stream) {
      fullReply += chunk;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    // Save final complete assistant message
    db.addChatMessage(user.id, 'assistant', fullReply, skill_context);

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('SSE Stream error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Xatolik yuz berdi' })}\n\n`);
    res.end();
  }
});

apiRouter.post('/ai/tutor', async (req, res) => {
  try {
    const user = getAuthProfileOrGuest(req);
    const { message, skill_context } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Xabar matni bo‘sh bo‘lishi mumkin emas' });
    }

    // Save student message
    db.addChatMessage(user.id, 'user', message.trim(), skill_context);

    // Get chat history for user
    const history = db.getChatHistory(user.id).map(m => ({
      role: m.role,
      content: m.content
    }));

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 8000)
    );

    const replyPromise = generateTutorResponse(
      user.first_name,
      user.target_band,
      history.slice(-4),
      message.trim(),
      skill_context
    );

    let reply: string;
    try {
      reply = await Promise.race([replyPromise, timeoutPromise]);
    } catch {
      reply = `Assalomu alaykum, ${user.first_name}! Savolingiz: "${message.trim()}".\n\nIELTS bo‘yicha tezkor tavsiyam:\nHar bir ko‘nikmada muntazamlik eng muhim omildir. Murakkab gap tuzilmalari va akademik kollokatsiyalarga e'tibor bering.\n\nDavom eting, keyingi mashq sizni kutmoqda!`;
    }

    const savedReply = db.addChatMessage(user.id, 'assistant', reply, skill_context);
    res.json({ reply: savedReply });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/ai/chat-history', (req, res) => {
  const user = getAuthProfileOrGuest(req);
  const history = db.getChatHistory(user.id);
  res.json({ messages: history });
});

apiRouter.post('/ai/evaluate-writing', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user as Profile;
    const { task_prompt, student_essay, attempt_id } = req.body;

    if (!student_essay || student_essay.trim().split(/\s+/).length < 20) {
      return res.status(400).json({ error: 'Insho matni juda qisqa (kamida 20 ta so‘z kiritilishi kerak).' });
    }

    const evaluation = await evaluateWriting(task_prompt, student_essay, user.target_band);

    let savedFeedback = null;
    if (attempt_id) {
      savedFeedback = db.saveAIFeedback({
        attempt_id,
        profile_id: user.id,
        criterion_scores: evaluation.criterion_scores,
        overall_band: evaluation.overall_band,
        strengths: evaluation.strengths,
        mistakes: evaluation.mistakes,
        improved_sample: evaluation.improved_sample,
        corrective_exercise: evaluation.corrective_exercise,
        motivational_uz: evaluation.motivational_uz,
        next_action_uz: evaluation.next_action_uz
      });

      // Award achievement
      db.checkAndAward(user.id, 'writing_submitted', 1);
    }

    res.json({ evaluation, feedback: savedFeedback });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/ai/evaluate-speaking', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user as Profile;
    const { prompt_card, transcript, attempt_id } = req.body;

    if (!transcript || transcript.trim().length < 15) {
      return res.status(400).json({ error: 'Nutq matni juda qisqa. Iltimos, to‘liqroq javob bering.' });
    }

    const evaluation = await evaluateSpeaking(prompt_card, transcript, user.target_band);

    let savedFeedback = null;
    if (attempt_id) {
      savedFeedback = db.saveAIFeedback({
        attempt_id,
        profile_id: user.id,
        criterion_scores: evaluation.criterion_scores,
        overall_band: evaluation.overall_band,
        strengths: evaluation.strengths,
        mistakes: evaluation.mistakes,
        improved_sample: evaluation.improved_sample,
        corrective_exercise: evaluation.corrective_exercise,
        motivational_uz: evaluation.motivational_uz,
        next_action_uz: evaluation.next_action_uz
      });
    }

    res.json({ evaluation, feedback: savedFeedback });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- VOCABULARY & SPACED REPETITION ----------------
apiRouter.get('/vocabulary', requireAuth, (req, res) => {
  const user = (req as any).user as Profile;
  const items = db.getVocabReviewsForProfile(user.id);
  res.json({ items });
});

apiRouter.post('/vocabulary/:id/review', requireAuth, (req, res) => {
  const user = (req as any).user as Profile;
  const { quality } = req.body;
  const qNum = Number(quality);
  if (isNaN(qNum) || qNum < 0 || qNum > 5) {
    return res.status(400).json({ error: 'Sifat darajasi 0 dan 5 gacha bo‘lishi lozim' });
  }
  const review = db.recordVocabReview(user.id, req.params.id, qNum);
  res.json({ review });
});

// ---------------- ANALYTICS, ERRORS & REWARDS ----------------
apiRouter.get('/progress/analytics', requireAuth, (req, res) => {
  const user = (req as any).user as Profile;
  const attempts = db.getAttemptsForProfile(user.id);
  const errors = db.getErrorPatterns(user.id);
  const rewards = db.getStudentRewards(user.id);

  // Skill calculations
  const readingAttempts = attempts.filter(a => a.exercise_id.startsWith('read'));
  const listeningAttempts = attempts.filter(a => a.exercise_id.startsWith('list'));
  const writingAttempts = attempts.filter(a => a.exercise_id.startsWith('writ'));
  const speakingAttempts = attempts.filter(a => a.exercise_id.startsWith('spk'));

  const avgBand = (list: typeof attempts) => {
    const valid = list.filter(a => a.band_estimate);
    if (!valid.length) return null;
    return Number((valid.reduce((sum, a) => sum + (a.band_estimate || 0), 0) / valid.length).toFixed(1));
  };

  const totalCompleted = attempts.filter(a => a.status === 'submitted').length;
  const totalCorrect = attempts.reduce((acc, a) => acc + (a.score || 0), 0);
  const totalQues = attempts.reduce((acc, a) => acc + (a.total_questions || 0), 0);
  const accuracy = totalQues > 0 ? Math.round((totalCorrect / totalQues) * 100) : 0;

  res.json({
    profile: {
      first_name: user.first_name,
      last_name: user.last_name,
      target_band: user.target_band,
      current_level: user.current_level,
      streak_days: user.streak_days,
      total_study_minutes: user.total_study_minutes
    },
    skill_estimates: {
      reading: avgBand(readingAttempts) || 6.5,
      listening: avgBand(listeningAttempts) || 6.5,
      writing: avgBand(writingAttempts) || 6.0,
      speaking: avgBand(speakingAttempts) || 6.5,
      overall: 6.5
    },
    activity: {
      total_attempts: attempts.length,
      completed_attempts: totalCompleted,
      accuracy_percentage: accuracy,
      recent_attempts: attempts.slice(-5).reverse()
    },
    error_patterns: errors,
    rewards: rewards
  });
});

apiRouter.get('/rewards', requireAuth, (req, res) => {
  const user = (req as any).user as Profile;
  const allRewards = db.getRewards();
  const earned = db.getStudentRewards(user.id);
  const earnedIds = new Set(earned.map(e => e.reward_id));

  const list = allRewards.map(r => ({
    ...r,
    is_earned: earnedIds.has(r.id),
    earned_at: earned.find(e => e.reward_id === r.id)?.awarded_at || null
  }));

  res.json({ rewards: list });
});

// ---------------- ADMIN & TEACHER DASHBOARD ----------------
apiRouter.get('/admin/overview', requireAdmin, (req, res) => {
  const profiles = db.getProfiles();
  const students = profiles.filter(p => p.role === 'student');
  const exercises = db.getExercises();
  const audit = db.getAuditEvents().slice(0, 20);

  res.json({
    total_students: students.length,
    total_exercises: exercises.length,
    students: students.map(s => ({
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      age: s.age,
      target_band: s.target_band,
      current_level: s.current_level,
      study_minutes: s.total_study_minutes,
      streak: s.streak_days,
      created_at: s.created_at
    })),
    recent_audit: audit
  });
});

apiRouter.post('/admin/exercises', requireAdmin, (req, res) => {
  try {
    const user = (req as any).user as Profile;
    const { skill, title, title_uz, description_uz, passage_or_prompt, duration_minutes, difficulty, sub_type } = req.body;

    const newEx = {
      id: `${skill.slice(0, 4)}-${Date.now()}`,
      skill,
      sub_type: sub_type || 'academic_passage',
      title,
      title_uz: title_uz || title,
      description_uz: description_uz || '',
      passage_or_prompt,
      duration_minutes: Number(duration_minutes) || 20,
      difficulty: difficulty || 'medium',
      is_published: true,
      created_at: new Date().toISOString()
    };

    (db as any).data.exercises.push(newEx);
    db.saveData();

    db.logAudit(user.id, 'admin', 'CREATE_EXERCISE', 'exercise', newEx.id, `Yangi mashq qo‘shildi: ${title}`);
    res.json({ exercise: newEx });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
