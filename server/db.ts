import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface Profile {
  id: string;
  role: 'student' | 'admin';
  first_name: string;
  last_name: string;
  age: number;
  pin_hash: string;
  target_band: number;
  current_level: string;
  exam_date?: string;
  study_hours_per_day: number;
  intensity: 'light' | 'moderate' | 'intensive';
  streak_days: number;
  total_study_minutes: number;
  last_active_date: string;
  created_at: string;
  updated_at: string;
}

export interface LearningPlan {
  id: string;
  profile_id: string;
  daily_objectives: { day: string; title: string; skill: string; duration_min: number; completed: boolean }[];
  weekly_milestones: { week: number; goal: string; target_band: number; completed: boolean }[];
  recommended_exercises: string[];
  weak_skills: { skill: string; error_count: number; focus_area: string }[];
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  exercise_id: string;
  question_number: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false_not_given' | 'yes_no_not_given' | 'matching_headings' | 'summary_completion' | 'short_answer';
  options?: string[];
  correct_answer: string;
  explanation_uz: string;
  evidence_passage?: string;
  error_category: string;
}

export interface Exercise {
  id: string;
  skill: 'reading' | 'listening' | 'writing' | 'speaking' | 'grammar' | 'vocabulary';
  sub_type: string;
  title: string;
  title_uz: string;
  description_uz: string;
  passage_or_prompt: string;
  audio_url?: string;
  audio_transcript?: string;
  duration_minutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_published: boolean;
  task_type?: 'task1' | 'task2' | 'part1' | 'part2' | 'part3';
  created_at: string;
}

export interface Attempt {
  id: string;
  profile_id: string;
  exercise_id: string;
  status: 'in_progress' | 'submitted' | 'expired';
  started_at: string;
  deadline_at: string;
  submitted_at?: string;
  score?: number;
  total_questions?: number;
  band_estimate?: number;
  duration_seconds?: number;
  user_text_response?: string;
}

export interface Answer {
  id: string;
  attempt_id: string;
  question_id: string;
  user_answer: string;
  is_correct?: boolean;
  saved_at: string;
}

export interface AIFeedback {
  id: string;
  attempt_id: string;
  profile_id: string;
  criterion_scores?: {
    task_response?: number;
    coherence_cohesion?: number;
    lexical_resource?: number;
    grammatical_accuracy?: number;
    fluency_coherence?: number;
    pronunciation?: number;
  };
  overall_band: number;
  strengths: string[];
  mistakes: { category: string; excerpt: string; explanation_uz: string; suggestion: string }[];
  improved_sample?: string;
  corrective_exercise?: string;
  motivational_uz: string;
  next_action_uz: string;
  created_at: string;
}

export interface ErrorPattern {
  id: string;
  profile_id: string;
  skill: string;
  category: string;
  count: number;
  latest_occurrence: string;
  last_attempt_id: string;
  corrective_recommendation: string;
}

export interface VocabItem {
  id: string;
  word: string;
  phonetic: string;
  uzbek_meaning: string;
  english_definition: string;
  example_sentence: string;
  level: 'B2' | 'C1' | 'C2';
  topic: string;
  collocations: string[];
}

export interface VocabReview {
  id: string;
  profile_id: string;
  vocab_id: string;
  mastery_level: number; // 0 to 5
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  reviewed_at: string;
}

export interface Reward {
  id: string;
  code: string;
  name_uz: string;
  description_uz: string;
  icon_name: string;
  points: number;
  criteria_type: 'streak' | 'reading_tests' | 'writing_submitted' | 'vocab_mastered' | 'first_test';
  criteria_value: number;
}

export interface StudentReward {
  id: string;
  profile_id: string;
  reward_id: string;
  awarded_at: string;
}

export interface AuditEvent {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  profile_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  skill_context?: string;
}

interface DatabaseSchema {
  profiles: Profile[];
  learning_plans: LearningPlan[];
  exercises: Exercise[];
  questions: Question[];
  attempts: Attempt[];
  answers: Answer[];
  ai_feedback: AIFeedback[];
  error_patterns: ErrorPattern[];
  vocab_items: VocabItem[];
  vocab_reviews: VocabReview[];
  rewards: Reward[];
  student_rewards: StudentReward[];
  audit_events: AuditEvent[];
  chat_messages: ChatMessage[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin + 'ielts_salt_2026').digest('hex');
}

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDirectory();
    this.data = this.loadData();
    if (this.data.exercises.length === 0 || !this.data.exercises.some(e => e.id === 'list-ex-2')) {
      this.seedInitialContent();
      this.saveData();
    }
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.exercises)) {
          const seen = new Set<string>();
          parsed.exercises = parsed.exercises.filter((e: any) => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
          });
        }
        if (Array.isArray(parsed.questions)) {
          const seenQ = new Set<string>();
          parsed.questions = parsed.questions.filter((q: any) => {
            if (seenQ.has(q.id)) return false;
            seenQ.add(q.id);
            return true;
          });
        }
        return parsed;
      } catch (e) {
        console.error('Error reading database, creating fresh structure:', e);
      }
    }
    return {
      profiles: [],
      learning_plans: [],
      exercises: [],
      questions: [],
      attempts: [],
      answers: [],
      ai_feedback: [],
      error_patterns: [],
      vocab_items: [],
      vocab_reviews: [],
      rewards: [],
      student_rewards: [],
      audit_events: [],
      chat_messages: []
    };
  }

  public saveData() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database:', e);
    }
  }

  // --- Profiles & Auth ---
  public getProfiles() {
    return this.data.profiles;
  }

  public getProfileById(id: string): Profile | undefined {
    return this.data.profiles.find(p => p.id === id);
  }

  public createProfile(profile: Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'streak_days' | 'total_study_minutes' | 'last_active_date'>): Profile {
    const now = new Date().toISOString();
    const newProfile: Profile = {
      ...profile,
      id: crypto.randomUUID(),
      streak_days: 1,
      total_study_minutes: 0,
      last_active_date: now.split('T')[0],
      created_at: now,
      updated_at: now,
    };
    this.data.profiles.push(newProfile);

    // Initial default rewards assignment check
    this.checkAndAward(newProfile.id, 'first_test', 0);
    this.saveData();
    return newProfile;
  }

  public updateProfile(id: string, updates: Partial<Profile>): Profile | null {
    const index = this.data.profiles.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.data.profiles[index] = {
      ...this.data.profiles[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveData();
    return this.data.profiles[index];
  }

  // --- Learning Plans ---
  public getPlanByProfileId(profileId: string): LearningPlan | undefined {
    return this.data.learning_plans.find(p => p.profile_id === profileId);
  }

  public createOrUpdatePlan(profileId: string, planData: Partial<LearningPlan>): LearningPlan {
    const existing = this.data.learning_plans.find(p => p.profile_id === profileId);
    const now = new Date().toISOString();
    if (existing) {
      Object.assign(existing, planData, { updated_at: now });
      this.saveData();
      return existing;
    } else {
      const newPlan: LearningPlan = {
        id: crypto.randomUUID(),
        profile_id: profileId,
        daily_objectives: planData.daily_objectives || [
          { day: 'Dushanba', title: 'Reading: Skimming & Scanning texnikalari', skill: 'reading', duration_min: 30, completed: true },
          { day: 'Seshanba', title: 'Listening: Form & Note Completion', skill: 'listening', duration_min: 25, completed: false },
          { day: 'Chorshanba', title: 'Writing Task 2: Fikrni mantiqiy asoslash', skill: 'writing', duration_min: 40, completed: false },
          { day: 'Payshanba', title: 'Speaking Part 2: 1-daqiqa rejalashtirish', skill: 'speaking', duration_min: 20, completed: false },
          { day: 'Juma', title: 'Grammar: Complex Sentences & Inversion', skill: 'grammar', duration_min: 30, completed: false },
          { day: 'Shanba', title: 'IELTS Full Mini-Mock Practice', skill: 'all', duration_min: 60, completed: false },
          { day: 'Yakshanba', title: 'Xatolar tahlili va yangi lug‘atlar takrori', skill: 'vocabulary', duration_min: 25, completed: false }
        ],
        weekly_milestones: planData.weekly_milestones || [
          { week: 1, goal: 'Readingda True/False/Not Given savollarida 80% aniqlik', target_band: 6.5, completed: false },
          { week: 2, goal: 'Writing Task 2 da 250+ so‘z va to‘g‘ri struktura', target_band: 7.0, completed: false },
          { week: 3, goal: 'Speakingda ikkilanishlarsiz ravon javob berish', target_band: 7.0, completed: false },
          { week: 4, goal: 'Umumiy Mock Test natijasi 7.0+ band', target_band: 7.5, completed: false }
        ],
        recommended_exercises: planData.recommended_exercises || ['read-ex-1', 'writ-ex-1', 'spk-ex-1'],
        weak_skills: planData.weak_skills || [
          { skill: 'Reading', error_count: 3, focus_area: 'Paraphrase recognition' },
          { skill: 'Writing', error_count: 2, focus_area: 'Lexical resource variety' }
        ],
        created_at: now,
        updated_at: now
      };
      this.data.learning_plans.push(newPlan);
      this.saveData();
      return newPlan;
    }
  }

  // --- Exercises & Questions ---
  public getExercises(skill?: string): Exercise[] {
    if (skill) {
      return this.data.exercises.filter(e => e.skill === skill && e.is_published);
    }
    return this.data.exercises;
  }

  public getExerciseById(id: string): Exercise | undefined {
    return this.data.exercises.find(e => e.id === id);
  }

  public getQuestionsForExercise(exerciseId: string, sanitize = true): Question[] {
    const list = this.data.questions.filter(q => q.exercise_id === exerciseId);
    if (sanitize) {
      // Strip correct_answer, explanation, and evidence during active attempt
      return list.map(q => ({
        id: q.id,
        exercise_id: q.exercise_id,
        question_number: q.question_number,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        correct_answer: '',
        explanation_uz: '',
        evidence_passage: '',
        error_category: ''
      }));
    }
    return list;
  }

  public getQuestionsRaw(exerciseId: string): Question[] {
    return this.data.questions.filter(q => q.exercise_id === exerciseId);
  }

  // --- Attempts & Timing Engine ---
  public createAttempt(profileId: string, exerciseId: string): Attempt {
    const exercise = this.getExerciseById(exerciseId);
    if (!exercise) throw new Error('Exercise not found');

    const now = new Date();
    // Authoritative server deadline: started_at + duration_minutes
    const durationMs = exercise.duration_minutes * 60 * 1000;
    const deadline = new Date(now.getTime() + durationMs);

    const attempt: Attempt = {
      id: crypto.randomUUID(),
      profile_id: profileId,
      exercise_id: exerciseId,
      status: 'in_progress',
      started_at: now.toISOString(),
      deadline_at: deadline.toISOString(),
    };
    this.data.attempts.push(attempt);
    this.saveData();
    return attempt;
  }

  public getAttemptById(attemptId: string): Attempt | undefined {
    return this.data.attempts.find(a => a.id === attemptId);
  }

  public getAttemptsForProfile(profileId: string): Attempt[] {
    return this.data.attempts.filter(a => a.profile_id === profileId);
  }

  public saveAnswer(attemptId: string, questionId: string, userAnswer: string): Answer {
    const attempt = this.getAttemptById(attemptId);
    if (!attempt) throw new Error('Attempt not found');
    if (attempt.status !== 'in_progress') {
      throw new Error('Muddati tugagan yoki yakunlangan urinishga javob saqlab bo‘lmaydi');
    }

    // Check if server deadline has expired
    const now = new Date().getTime();
    const deadline = new Date(attempt.deadline_at).getTime();
    if (now > deadline + 15000) { // 15 second network grace
      attempt.status = 'expired';
      this.saveData();
      throw new Error('Mashq vaqti yakunlandi. Server muddatni yopdi.');
    }

    const existingIndex = this.data.answers.findIndex(
      a => a.attempt_id === attemptId && a.question_id === questionId
    );

    const nowIso = new Date().toISOString();
    if (existingIndex >= 0) {
      this.data.answers[existingIndex].user_answer = userAnswer;
      this.data.answers[existingIndex].saved_at = nowIso;
      this.saveData();
      return this.data.answers[existingIndex];
    } else {
      const newAnswer: Answer = {
        id: crypto.randomUUID(),
        attempt_id: attemptId,
        question_id: questionId,
        user_answer: userAnswer,
        saved_at: nowIso
      };
      this.data.answers.push(newAnswer);
      this.saveData();
      return newAnswer;
    }
  }

  public getAnswersForAttempt(attemptId: string): Answer[] {
    return this.data.answers.filter(a => a.attempt_id === attemptId);
  }

  public submitAttempt(attemptId: string, userTextResponse?: string): {
    attempt: Attempt;
    score: number;
    total: number;
    band_estimate: number;
    details: { question: Question; user_answer: string; is_correct: boolean }[];
  } {
    const attempt = this.getAttemptById(attemptId);
    if (!attempt) throw new Error('Attempt not found');
    if (attempt.status === 'submitted') {
      throw new Error('Bu mashq allaqachon topshirilgan');
    }

    const exercise = this.getExerciseById(attempt.exercise_id);
    if (!exercise) throw new Error('Exercise not found');

    const questions = this.getQuestionsRaw(attempt.exercise_id);
    const answers = this.getAnswersForAttempt(attemptId);
    const answerMap = new Map(answers.map(a => [a.question_id, a.user_answer.trim().toLowerCase()]));

    let correctCount = 0;
    const details = questions.map(q => {
      const uAns = answerMap.get(q.id) || '';
      const isCorrect = uAns === q.correct_answer.trim().toLowerCase();
      if (isCorrect) correctCount++;
      return {
        question: q,
        user_answer: uAns,
        is_correct: isCorrect
      };
    });

    const now = new Date();
    const durationSeconds = Math.round((now.getTime() - new Date(attempt.started_at).getTime()) / 1000);

    // Calculate IELTS Band Estimate
    let band = 5.0;
    const total = questions.length;
    if (total > 0) {
      const ratio = correctCount / total;
      if (ratio >= 0.9) band = 8.5;
      else if (ratio >= 0.8) band = 7.5;
      else if (ratio >= 0.7) band = 7.0;
      else if (ratio >= 0.6) band = 6.5;
      else if (ratio >= 0.5) band = 6.0;
      else if (ratio >= 0.4) band = 5.5;
      else band = 4.5;
    }

    attempt.status = 'submitted';
    attempt.submitted_at = now.toISOString();
    attempt.score = correctCount;
    attempt.total_questions = total;
    attempt.band_estimate = band;
    attempt.duration_seconds = durationSeconds;
    if (userTextResponse) {
      attempt.user_text_response = userTextResponse;
    }

    // Record error patterns for mistakes
    details.filter(d => !d.is_correct).forEach(d => {
      this.recordErrorPattern(attempt.profile_id, exercise.skill, d.question.error_category || 'general_comprehension', attempt.id);
    });

    // Update student study time & streak
    const profile = this.getProfileById(attempt.profile_id);
    if (profile) {
      profile.total_study_minutes += Math.max(1, Math.round(durationSeconds / 60));
      this.checkAndAward(profile.id, 'reading_tests', 1);
      this.updateProfile(profile.id, {
        total_study_minutes: profile.total_study_minutes,
        last_active_date: now.toISOString().split('T')[0]
      });
    }

    this.saveData();
    return { attempt, score: correctCount, total, band_estimate: band, details };
  }

  // --- Error Analysis ---
  public recordErrorPattern(profileId: string, skill: string, category: string, attemptId: string) {
    const existing = this.data.error_patterns.find(
      e => e.profile_id === profileId && e.skill === skill && e.category === category
    );
    const now = new Date().toISOString();
    if (existing) {
      existing.count += 1;
      existing.latest_occurrence = now;
      existing.last_attempt_id = attemptId;
    } else {
      this.data.error_patterns.push({
        id: crypto.randomUUID(),
        profile_id: profileId,
        skill,
        category,
        count: 1,
        latest_occurrence: now,
        last_attempt_id: attemptId,
        corrective_recommendation: this.getRecommendationForCategory(category)
      });
    }
    this.saveData();
  }

  private getRecommendationForCategory(category: string): string {
    const map: Record<string, string> = {
      paraphrase_recognition: 'Matndagi sinonimlar va sinonimik iboralarga alohida e’tibor bering. Lug‘at bo‘limidagi B2-C1 so‘zlarini takrorlang.',
      inference_error: 'Matnda to‘g‘ridan-to‘g‘ri aytilmagan ma’lumotni o‘zingizdan qo‘shib baholamang (Not Given qoidasi).',
      evidence_location: 'Savoldagi kalit so‘zlarni matndan topish (scanning) tezligini oshiruvchi mashqlarni bajaring.',
      spelling_mistake: 'So‘zlarning to‘g‘ri yozilishini tekshiring, ayniqsa qo‘sh undoshli (e.g. accommodation, necessary) so‘zlar.',
      grammar_accuracy: 'Grammatika bo‘limidagi murakkab gaplar va zamonlar moslashuvi modulini o‘rganing.'
    };
    return map[category] || 'Muntazam takrorlash va xatoni chuqur tahlil qilish tavsiya etiladi.';
  }

  public getErrorPatterns(profileId: string): ErrorPattern[] {
    return this.data.error_patterns.filter(e => e.profile_id === profileId).sort((a, b) => b.count - a.count);
  }

  // --- AI Feedback ---
  public saveAIFeedback(feedback: Omit<AIFeedback, 'id' | 'created_at'>): AIFeedback {
    const newFeedback: AIFeedback = {
      ...feedback,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    this.data.ai_feedback.push(newFeedback);
    this.saveData();
    return newFeedback;
  }

  public getAIFeedbackForAttempt(attemptId: string): AIFeedback | undefined {
    return this.data.ai_feedback.find(f => f.attempt_id === attemptId);
  }

  // --- Vocabulary & Spaced Repetition ---
  public getVocabItems(): VocabItem[] {
    return this.data.vocab_items;
  }

  public getVocabReviewsForProfile(profileId: string) {
    const reviews = this.data.vocab_reviews.filter(r => r.profile_id === profileId);
    const reviewMap = new Map(reviews.map(r => [r.vocab_id, r]));
    return this.data.vocab_items.map(item => ({
      ...item,
      review: reviewMap.get(item.id) || null
    }));
  }

  public recordVocabReview(profileId: string, vocabId: string, quality: number) {
    // Quality: 0 to 5 (SuperMemo-2 inspired)
    let review = this.data.vocab_reviews.find(r => r.profile_id === profileId && r.vocab_id === vocabId);
    const now = new Date();
    if (!review) {
      review = {
        id: crypto.randomUUID(),
        profile_id: profileId,
        vocab_id: vocabId,
        mastery_level: quality,
        next_review_at: new Date(now.getTime() + 86400000).toISOString(),
        interval_days: 1,
        ease_factor: 2.5,
        reviewed_at: now.toISOString()
      };
      this.data.vocab_reviews.push(review);
    } else {
      if (quality >= 3) {
        review.interval_days = review.interval_days === 1 ? 6 : Math.round(review.interval_days * review.ease_factor);
        review.mastery_level = Math.min(5, review.mastery_level + 1);
      } else {
        review.interval_days = 1;
        review.mastery_level = Math.max(0, review.mastery_level - 1);
      }
      review.ease_factor = Math.max(1.3, review.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
      review.next_review_at = new Date(now.getTime() + review.interval_days * 86400000).toISOString();
      review.reviewed_at = now.toISOString();
    }
    this.saveData();
    return review;
  }

  // --- Rewards & Achievements ---
  public getRewards(): Reward[] {
    return this.data.rewards;
  }

  public getStudentRewards(profileId: string): (StudentReward & { reward: Reward })[] {
    const studentRewards = this.data.student_rewards.filter(sr => sr.profile_id === profileId);
    const rewardMap = new Map(this.data.rewards.map(r => [r.id, r]));
    return studentRewards
      .map(sr => {
        const reward = rewardMap.get(sr.reward_id);
        return reward ? { ...sr, reward } : null;
      })
      .filter((x): x is StudentReward & { reward: Reward } => x !== null);
  }

  public checkAndAward(profileId: string, type: Reward['criteria_type'], count = 1) {
    const matchingRewards = this.data.rewards.filter(r => r.criteria_type === type);
    matchingRewards.forEach(r => {
      const alreadyHas = this.data.student_rewards.some(sr => sr.profile_id === profileId && sr.reward_id === r.id);
      if (!alreadyHas) {
        this.data.student_rewards.push({
          id: crypto.randomUUID(),
          profile_id: profileId,
          reward_id: r.id,
          awarded_at: new Date().toISOString()
        });
      }
    });
    this.saveData();
  }

  // --- Audit Events ---
  public logAudit(actorId: string, actorRole: string, action: string, entityType: string, entityId: string, details: string) {
    this.data.audit_events.push({
      id: crypto.randomUUID(),
      actor_id: actorId,
      actor_role: actorRole,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      timestamp: new Date().toISOString()
    });
    this.saveData();
  }

  public getAuditEvents(): AuditEvent[] {
    return [...this.data.audit_events].reverse();
  }

  // --- Chat Messages ---
  public getChatHistory(profileId: string): ChatMessage[] {
    return this.data.chat_messages.filter(m => m.profile_id === profileId);
  }

  public addChatMessage(profileId: string, role: 'user' | 'assistant', content: string, skill_context?: string): ChatMessage {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      profile_id: profileId,
      role,
      content,
      timestamp: new Date().toISOString(),
      skill_context
    };
    this.data.chat_messages.push(msg);
    this.saveData();
    return msg;
  }

  // --- Content Seed ---
  private seedInitialContent() {
    // Admin profile
    const adminPin = hashPin('9944');
    this.data.profiles.push({
      id: 'admin-master-id',
      role: 'admin',
      first_name: 'Administrator',
      last_name: 'IELTS Mentor',
      age: 32,
      pin_hash: adminPin,
      target_band: 9.0,
      current_level: 'C2',
      study_hours_per_day: 4,
      intensity: 'intensive',
      streak_days: 30,
      total_study_minutes: 2400,
      last_active_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Student demo profile
    const studentPin = hashPin('1234');
    const demoStudentId = 'demo-student-id';
    this.data.profiles.push({
      id: demoStudentId,
      role: 'student',
      first_name: 'Azizbek',
      last_name: 'Karimov',
      age: 20,
      pin_hash: studentPin,
      target_band: 7.5,
      current_level: 'B2',
      exam_date: '2026-12-15',
      study_hours_per_day: 2,
      intensity: 'intensive',
      streak_days: 7,
      total_study_minutes: 420,
      last_active_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 1. Reading Exercise
    const readEx1: Exercise = {
      id: 'read-ex-1',
      skill: 'reading',
      sub_type: 'academic_passage',
      title: 'The Architecture of Biophilic Urban Design',
      title_uz: 'Biofil shahar arxitekturasi va uning psixologik ta’siri',
      description_uz: 'IELTS Academic Reading Passage 2 standarti. True/False/Not Given va xulosa to‘ldirish savollari.',
      passage_or_prompt: `For decades, modern metropolitan landscapes have been dominated by steel, concrete, and asphalt—materials engineered for structural efficiency and density rather than biological harmony. However, an emerging architectural paradigm known as 'biophilic design' posits that human psychological and physiological equilibrium is intrinsically intertwined with natural ecosystems. Pioneered by sociobiologist Edward O. Wilson, the biophilia hypothesis suggests that humans possess an innate biological affinity for the living world.

Recent empirical investigations conducted in Singapore and Copenhagen indicate that integrating vertical forests, sky gardens, and uninhibited natural light into high-density commercial towers correlates with a 15% reduction in occupational stress and a measurable improvement in cognitive restoration. Architects argue that this approach transcends mere aesthetic embellishment; it fundamentally redesigns environmental acoustics and improves interior air filtration through natural evapotranspiration.

Nonetheless, skeptics contend that biophilic retrofitting presents steep economic barriers. The structural reinforcement needed to support elevated soil loads and irrigation systems elevates upfront engineering costs by approximately 18 to 22 percent. Moreover, without rigorous botanical management, non-native plant species introduce pest liabilities. Despite these fiscal hurdles, leading municipal authorities in Tokyo and Melbourne are now codifying mandatory living-wall ratios for new commercial developments, asserting that the long-term public health savings far outweigh initial capital expenditures.`,
      duration_minutes: 20,
      difficulty: 'medium',
      is_published: true,
      created_at: new Date().toISOString()
    };
    this.data.exercises.push(readEx1);

    // Questions for readEx1
    this.data.questions.push(
      {
        id: 'q-read-1',
        exercise_id: 'read-ex-1',
        question_number: 1,
        question_text: "Edward O. Wilson was primarily an architect who invented vertical urban gardens.",
        question_type: 'true_false_not_given',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correct_answer: 'FALSE',
        explanation_uz: "Matnda Wilson 'sociobiologist' (sotsiobiolog) deb atalgan va u 'biophilia hypothesis' asoschisi sifatida keltirilgan, vertikal bog‘larni ixtiro qilgan arxitektor emas.",
        evidence_passage: "Pioneered by sociobiologist Edward O. Wilson, the biophilia hypothesis suggests...",
        error_category: 'paraphrase_recognition'
      },
      {
        id: 'q-read-2',
        exercise_id: 'read-ex-1',
        question_number: 2,
        question_text: "Research in Singapore and Copenhagen demonstrated that natural light and greenery lowered work-related stress by fifteen percent.",
        question_type: 'true_false_not_given',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correct_answer: 'TRUE',
        explanation_uz: "Matndagi dalil to‘g‘ridan-to‘g‘ri mos keladi: 'correlates with a 15% reduction in occupational stress'.",
        evidence_passage: "Recent empirical investigations conducted in Singapore and Copenhagen indicate that integrating vertical forests... correlates with a 15% reduction in occupational stress",
        error_category: 'evidence_location'
      },
      {
        id: 'q-read-3',
        exercise_id: 'read-ex-1',
        question_number: 3,
        question_text: "Tokyo has banned all construction companies that refuse to install living walls.",
        question_type: 'true_false_not_given',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correct_answer: 'NOT GIVEN',
        explanation_uz: "Matnda Tokioda majburiy nisbatlar kiritilayotgani aytilgan, lekin rad etgan qurilish kompaniyalarini butunlay taqiqlash (banned all construction companies) haqida hech qanday ma’lumot berilmagan.",
        evidence_passage: "municipal authorities in Tokyo and Melbourne are now codifying mandatory living-wall ratios...",
        error_category: 'inference_error'
      },
      {
        id: 'q-read-4',
        exercise_id: 'read-ex-1',
        question_number: 4,
        question_text: "What is the primary factor that increases the initial cost of biophilic buildings by up to 22%?",
        question_type: 'multiple_choice',
        options: [
          'A) Importing rare exotic flowers from South America',
          'B) Structural reinforcement for soil loads and irrigation systems',
          'C) High salaries required by European botanical specialists',
          'D) Acoustic monitoring sensors placed throughout the ceiling'
        ],
        correct_answer: 'B) Structural reinforcement for soil loads and irrigation systems',
        explanation_uz: "Matnda xarajat 18-22% oshishi sababi sifatida tuproq og‘irligi va sug‘orish tizimlari uchun muhandislik mustahkamlashi ko‘rsatilgan.",
        evidence_passage: "The structural reinforcement needed to support elevated soil loads and irrigation systems elevates upfront engineering costs by approximately 18 to 22 percent.",
        error_category: 'evidence_location'
      }
    );

    // 2. Listening Exercise
    const listEx1: Exercise = {
      id: 'list-ex-1',
      skill: 'listening',
      sub_type: 'academic_lecture',
      title: 'Campus Accommodation and Student Support Briefing',
      title_uz: 'Universitet yotoqxonasi va talabalar markazi brifingi',
      description_uz: 'IELTS Listening Section 1 & 2 formati. Telefon orqali ro‘yxatdan o‘tish va qoidalar.',
      passage_or_prompt: 'Listen to the conversation between an international student and an accommodation coordinator.',
      audio_url: 'https://ais-audio-demo.storage.googleapis.com/ielts_listening_sample1.mp3',
      audio_transcript: `Officer: Good morning, University Housing Office. How may I help you?
Student: Hello. I'm an incoming postgraduate student from Uzbekistan. My name is Dilshod Rakhimov. I'd like to confirm my residence hall allocation.
Officer: Welcome Dilshod! Let me pull up your student portal. Could you provide your student ID number?
Student: Yes, it is UK-90842.
Officer: Thank you. Yes, you have been assigned to 'Meadow View Hall', Room 402B. It includes an en-suite bathroom and shared kitchen facilities with 4 other postgrads.
Student: That sounds excellent. What is the quarterly rental fee, and does it include broadband internet?
Officer: The quarterly rent is 1,850 pounds, fully inclusive of ultra-fast fiber broadband, heating, and water. Laundry cards can be loaded online.
Student: Perfect. What is the latest check-in time on September 18th?
Officer: The reception desk operates 24 hours, but key collection for inventory inspection must be completed before 8:00 PM.`,
      duration_minutes: 15,
      difficulty: 'easy',
      is_published: true,
      created_at: new Date().toISOString()
    };
    this.data.exercises.push(listEx1);

    this.data.questions.push(
      {
        id: 'q-list-1',
        exercise_id: 'list-ex-1',
        question_number: 1,
        question_text: "What is Dilshod's student ID number?",
        question_type: 'multiple_choice',
        options: ['UK-90824', 'UK-90842', 'UZ-90842', 'UK-90482'],
        correct_answer: 'UK-90842',
        explanation_uz: "Talaba o‘z ID raqamini aniq 'UK-90842' deb aytadi.",
        evidence_passage: "Student: Yes, it is UK-90842.",
        error_category: 'spelling_mistake'
      },
      {
        id: 'q-list-2',
        exercise_id: 'list-ex-1',
        question_number: 2,
        question_text: "How much is the quarterly accommodation rent?",
        question_type: 'multiple_choice',
        options: ['1,450 pounds', '1,800 pounds', '1,850 pounds', '2,100 pounds'],
        correct_answer: '1,850 pounds',
        explanation_uz: "Ofitser '1,850 pounds, fully inclusive...' deb ma'lum qiladi.",
        evidence_passage: "The quarterly rent is 1,850 pounds, fully inclusive...",
        error_category: 'evidence_location'
      },
      {
        id: 'q-list-3',
        exercise_id: 'list-ex-1',
        question_number: 3,
        question_text: "By what time must key collection and inventory inspection be completed?",
        question_type: 'multiple_choice',
        options: ['6:00 PM', '8:00 PM', '10:00 PM', 'Midnight (12:00 AM)'],
        correct_answer: '8:00 PM',
        explanation_uz: "Qabulxonaning 24 soat ochiqligi chalg‘ituvchi omil bo‘lib, kalit olish aynan soat 8:00 PM gacha bajarilishi lozim.",
        evidence_passage: "...key collection for inventory inspection must be completed before 8:00 PM.",
        error_category: 'inference_error'
      }
    );

    // 2b. Listening Exercise 2 (Section 2 - Library Orientation)
    const listEx2: Exercise = {
      id: 'list-ex-2',
      skill: 'listening',
      sub_type: 'information_matching',
      title: 'Manchester Central Library Orientation & Digital Archives',
      title_uz: 'Shahar markaziy kutubxonasi va arxivlar bo‘yicha qo‘llanma',
      description_uz: 'IELTS Listening Section 2 formati. Monolog tinglash, qoidalar va xonalar taqsimoti.',
      passage_or_prompt: 'Listen to the chief archivist delivering an orientation talk to new university researchers.',
      audio_url: '/api/audio/exercise/list-ex-2',
      audio_transcript: `Speaker: Good morning and welcome to Manchester Central Library. My name is Helen Davies, the chief archivist, and today I will give you a quick orientation before you start your research projects.
First of all, our opening hours are Monday to Saturday from 8:30 AM to 7:00 PM. On Sundays, we are open strictly between 10:00 AM and 4:00 PM for private study only.
Now, regarding the floor layout. As you enter through the main revolving doors on the Ground Floor, you will see the Reception Desk straight ahead. If you turn immediately to your left, you will find the New Arrivals and Fiction wing. To your right is the Computer and Internet Lab, which has 40 workstations.
The Second Floor houses our Humanities and Social Sciences collections, alongside our Group Study Pods. Please remember, group discussions are strictly confined to these pods.
For those of you conducting historical or genealogical research, the Rare Manuscripts and Local Heritage Archives are located on Level 3. Access to this level requires a pre-booked security badge, which you can obtain from Reception after paying a refundable key deposit of 20 pounds.
Lastly, standard members can borrow up to 8 books at any time for a duration of 3 weeks. Fines for overdue books are 50 pence per day, so please renew them online through your library account.
Now, if you have any questions, I will be glad to take them.`,
      duration_minutes: 15,
      difficulty: 'medium',
      is_published: true,
      created_at: new Date().toISOString()
    };
    this.data.exercises.push(listEx2);

    this.data.questions.push(
      {
        id: 'q-list2-1',
        exercise_id: 'list-ex-2',
        question_number: 1,
        question_text: "What are the library's Sunday opening hours?",
        question_type: 'multiple_choice',
        options: ['8:30 AM - 7:00 PM', '9:00 AM - 5:00 PM', '10:00 AM - 4:00 PM', 'Closed on Sundays'],
        correct_answer: '10:00 AM - 4:00 PM',
        explanation_uz: "Dushanba-shanba 8:30-19:00, ammo yakshanba kuni aniq 10:00 AM dan 4:00 PM gacha ochiq.",
        evidence_passage: "On Sundays, we are open strictly between 10:00 AM and 4:00 PM for private study only.",
        error_category: 'evidence_location'
      },
      {
        id: 'q-list2-2',
        exercise_id: 'list-ex-2',
        question_number: 2,
        question_text: "Where are the Rare Manuscripts and Local Heritage Archives located?",
        question_type: 'multiple_choice',
        options: ['Ground Floor', 'Level 1', 'Level 2', 'Level 3'],
        correct_answer: 'Level 3',
        explanation_uz: "Noyob qo'lyozmalar va tarixiy arxivlar 3-qavatda (Level 3) joylashgan.",
        evidence_passage: "...the Rare Manuscripts and Local Heritage Archives are located on Level 3.",
        error_category: 'evidence_location'
      },
      {
        id: 'q-list2-3',
        exercise_id: 'list-ex-2',
        question_number: 3,
        question_text: "How many books can standard members borrow at a time?",
        question_type: 'multiple_choice',
        options: ['4 books', '6 books', '8 books', '10 books'],
        correct_answer: '8 books',
        explanation_uz: "A'zolar bir vaqtning o'zida 8 tagacha kitob olishlari mumkin.",
        evidence_passage: "Lastly, standard members can borrow up to 8 books at any time...",
        error_category: 'evidence_location'
      },
      {
        id: 'q-list2-4',
        exercise_id: 'list-ex-2',
        question_number: 4,
        question_text: "What is the refundable key deposit for accessing Level 3?",
        question_type: 'multiple_choice',
        options: ['10 pounds', '15 pounds', '20 pounds', '25 pounds'],
        correct_answer: '20 pounds',
        explanation_uz: "Xavfsizlik nishoni uchun 20 funt qaytariladigan depozit to'lanishi lozim.",
        evidence_passage: "...after paying a refundable key deposit of 20 pounds.",
        error_category: 'spelling_mistake'
      }
    );

    // 2c. Listening Exercise 3 (Section 4 - Academic Lecture)
    const listEx3: Exercise = {
      id: 'list-ex-3',
      skill: 'listening',
      sub_type: 'academic_lecture',
      title: 'Marine Bioluminescence: Biological Mechanisms & Evolutionary Functions',
      title_uz: 'Dengiz biolyuminessensiyasi: Mexanizmlar va evolyutsiya',
      description_uz: 'IELTS Listening Section 4 formati. Monolog akademik ma’ruza, kimyoviy jarayonlar va funksiyalar.',
      passage_or_prompt: 'Listen to part of an academic lecture on marine biology.',
      audio_url: '/api/audio/exercise/list-ex-3',
      audio_transcript: `Lecturer: Good afternoon, students. In today's marine biology lecture, we will examine bioluminescence — the production and emission of light by living organisms in aquatic environments.
Unlike incandescent light bulbs, which lose over 90 percent of their energy as heat, bioluminescent light is known as cold light. In fact, less than 20 percent of the reaction produces thermal energy, making it exceptionally efficient.
The fundamental chemical reaction requires two unique compounds: a light-emitting pigment called luciferin, and an enzyme known as luciferase. When luciferin reacts with oxygen in the presence of luciferase, light is produced.
Now, why have deep-sea creatures developed this capability? Marine biologists categorize its evolutionary functions into three main purposes.
First, offensive predation. The anglerfish famously dangles a luminous lure from its head, mimicking small prey to attract unsuspecting fish into its jaws.
Second, defensive camouflage. Many squid and fish species employ a technique called counter-illumination. By emitting faint bluish light from their ventral underbellies, they match the sunlight filtering down from the surface, effectively rendering themselves invisible to predators lurking beneath them.
And third, intraspecific communication and mating displays, frequently observed in ostracod crustaceans off the Caribbean reefs.
Tomorrow, we will explore laboratory applications of GFP, or green fluorescent protein, derived from jellyfish.`,
      duration_minutes: 20,
      difficulty: 'hard',
      is_published: true,
      created_at: new Date().toISOString()
    };
    this.data.exercises.push(listEx3);

    this.data.questions.push(
      {
        id: 'q-list3-1',
        exercise_id: 'list-ex-3',
        question_number: 1,
        question_text: "Why is bioluminescent light described as 'cold light'?",
        question_type: 'multiple_choice',
        options: [
          'It only occurs in freezing polar ocean depths',
          'Less than 20% of the reaction produces thermal energy',
          'It requires temperatures below zero to activate',
          'It completely absorbs heat from surrounding seawater'
        ],
        correct_answer: 'Less than 20% of the reaction produces thermal energy',
        explanation_uz: "Ma'ruzachi reaksiyaning 20% dan kamrog'i issiqlik energiyasi hosil qilishini, shuning uchun 'sovuq nur' deb atalishini tushuntiradi.",
        evidence_passage: "In fact, less than 20 percent of the reaction produces thermal energy, making it exceptionally efficient.",
        error_category: 'evidence_location'
      },
      {
        id: 'q-list3-2',
        exercise_id: 'list-ex-3',
        question_number: 2,
        question_text: "What two compounds are essential for producing bioluminescent light?",
        question_type: 'multiple_choice',
        options: [
          'Luciferin and luciferase',
          'Chlorophyll and nitrogen',
          'Hemoglobin and calcium',
          'Melanin and keratin'
        ],
        correct_answer: 'Luciferin and luciferase',
        explanation_uz: "Reaksiya lyutsiferin (pigment) va lyutsiferaza (ferment) birikmasini talab qiladi.",
        evidence_passage: "...a light-emitting pigment called luciferin, and an enzyme known as luciferase.",
        error_category: 'evidence_location'
      },
      {
        id: 'q-list3-3',
        exercise_id: 'list-ex-3',
        question_number: 3,
        question_text: "How does 'counter-illumination' protect marine species from predators?",
        question_type: 'multiple_choice',
        options: [
          'It temporarily blinds approaching predators with flashes',
          'It produces heat shock waves in the water',
          'It matches surface light to conceal their silhouette from beneath',
          'It mimics dangerous toxic jellyfish'
        ],
        correct_answer: 'It matches surface light to conceal their silhouette from beneath',
        explanation_uz: "Qorindagi yorug'lik tepadan tushayotgan quyosh nuri bilan uyg'unlashib, pastdagi yirtqichlarga ko'rinmas qiladi.",
        evidence_passage: "By emitting faint bluish light from their ventral underbellies, they match the sunlight filtering down from the surface...",
        error_category: 'inference_error'
      }
    );

    // 3. Writing Exercise Task 2
    const writeEx1: Exercise = {
      id: 'writ-ex-1',
      skill: 'writing',
      sub_type: 'academic_task2',
      task_type: 'task2',
      title: 'IELTS Academic Writing Task 2: Artificial Intelligence in Higher Education',
      title_uz: 'Writing Task 2: Ta’limda sun’iy intellektning roli',
      description_uz: '250 ta so‘zdan kam bo‘lmagan to‘liq akademik insho yozing. 40 daqiqa vaqt ajratilgan.',
      passage_or_prompt: `You should spend about 40 minutes on this task.

Write about the following topic:

"Some people believe that artificial intelligence tools will entirely replace human university professors within the next two decades, while others maintain that human mentorship remains irreplaceable in higher education."

Discuss both views and give your own opinion.

Give reasons for your answer and include any relevant examples from your own knowledge or experience.
Write at least 250 words.`,
      duration_minutes: 40,
      difficulty: 'hard',
      is_published: true,
      created_at: new Date().toISOString()
    };
    this.data.exercises.push(writeEx1);

    // 4. Speaking Exercise Part 2
    const speakEx1: Exercise = {
      id: 'spk-ex-1',
      skill: 'speaking',
      sub_type: 'speaking_part2',
      task_type: 'part2',
      title: 'IELTS Speaking Part 2: Cue Card Challenge',
      title_uz: 'Speaking Part 2: 1-daqiqa tayyorgarlik va 2-daqiqa nutq',
      description_uz: 'Berilgan kartochka bo‘yicha 1 daqiqa reja tuzing va 2 daqiqa davomida mikrofon orqali inglizcha gapiring.',
      passage_or_prompt: `Describe an ambitious personal goal that you succeeded in achieving.

You should say:
- What the goal was
- When and why you decided to pursue it
- What difficulties or obstacles you had to overcome
- And explain how you felt when you successfully achieved it.`,
      duration_minutes: 5,
      difficulty: 'medium',
      is_published: true,
      created_at: new Date().toISOString()
    };
    this.data.exercises.push(speakEx1);

    // 5. Grammar Drill Exercise
    const gramEx1: Exercise = {
      id: 'gram-ex-1',
      skill: 'grammar',
      sub_type: 'grammar_drill',
      title: 'Inversion and Conditionals in Academic Discourse',
      title_uz: 'Inversiya va murakkab shart gaplar (Band 7.0+ Grammatika)',
      description_uz: 'Akademik insho va rasmiy nutq uchun yuqori ball beruvchi strukturalar.',
      passage_or_prompt: 'Choose the grammatically accurate and most stylistically sophisticated academic option.',
      duration_minutes: 10,
      difficulty: 'hard',
      is_published: true,
      created_at: new Date().toISOString()
    };
    this.data.exercises.push(gramEx1);

    this.data.questions.push(
      {
        id: 'q-gram-1',
        exercise_id: 'gram-ex-1',
        question_number: 1,
        question_text: "Rarely _______ such an unprecedented correlation between green spaces and productivity.",
        question_type: 'multiple_choice',
        options: [
          'A) researchers have observed',
          'B) have researchers observed',
          'C) researchers did observe',
          'D) do researchers had observed'
        ],
        correct_answer: 'B) have researchers observed',
        explanation_uz: "Gap 'Rarely' inkor yuklamasi bilan boshlanganda inversiya (yordamchi fe'l egadan oldinga chiqadi) qo‘llaniladi: Rarely have researchers observed...",
        error_category: 'grammar_accuracy'
      },
      {
        id: 'q-gram-2',
        exercise_id: 'gram-ex-1',
        question_number: 2,
        question_text: "_______ governments implemented stricter carbon controls earlier, atmospheric degradation would be substantially less acute today.",
        question_type: 'multiple_choice',
        options: [
          'A) If had',
          'B) Had',
          'C) Should',
          'D) Were'
        ],
        correct_answer: 'B) Had',
        explanation_uz: "Third Conditional inversiyasida 'If' tushib qolib, gap 'Had + ega + past participle' bilan tuziladi: Had governments implemented...",
        error_category: 'grammar_accuracy'
      }
    );

    // 6. Vocabulary Seed Items
    const vocabs: VocabItem[] = [
      {
        id: 'v-1',
        word: 'Substantiate',
        phonetic: '/səbˈstæn.ʃi.eɪt/',
        uzbek_meaning: 'Dalillar bilan isbotlamoq, asoslamoq',
        english_definition: 'To provide evidence to support or prove the truth of an assertion.',
        example_sentence: 'The candidate failed to substantiate her claims with empirical academic data.',
        level: 'C1',
        topic: 'Academic Writing & Argumentation',
        collocations: ['substantiate an allegation', 'substantiate a hypothesis', 'empirical evidence to substantiate']
      },
      {
        id: 'v-2',
        word: 'Ubiquitous',
        phonetic: '/juːˈbɪk.wɪ.təs/',
        uzbek_meaning: 'Hamma joyda uchraydigan, keng tarqalgan',
        english_definition: 'Present, appearing, or found everywhere simultaneously.',
        example_sentence: 'Smartphones and digital interfaces have become ubiquitous in secondary education.',
        level: 'C1',
        topic: 'Technology & Society',
        collocations: ['ubiquitous presence', 'become increasingly ubiquitous', 'ubiquitous computing']
      },
      {
        id: 'v-3',
        word: 'Pragmatic',
        phonetic: '/præɡˈmæt.ɪk/',
        uzbek_meaning: 'Amaliy, real vaziyatga moslashuvchan',
        english_definition: 'Dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.',
        example_sentence: 'Policymakers must adopt a pragmatic approach to renewable energy subsidies.',
        level: 'B2',
        topic: 'Governance & Society',
        collocations: ['pragmatic solution', 'pragmatic approach', 'pragmatic compromise']
      },
      {
        id: 'v-4',
        word: 'Exacerbate',
        phonetic: '/ɪɡˈzæs.ə.beɪt/',
        uzbek_meaning: 'Og‘irlashtirmoq, vaziyatni yanada yomonlashtirmoq',
        english_definition: 'To make a problem, bad situation, or negative feeling worse.',
        example_sentence: 'Rapid urbanization without adequate transit infrastructure exacerbates traffic congestion.',
        level: 'C1',
        topic: 'Environment & Urban Life',
        collocations: ['exacerbate the problem', 'exacerbate inequalities', 'further exacerbate tension']
      },
      {
        id: 'v-5',
        word: 'Plausible',
        phonetic: '/ˈplɔː.zə.bəl/',
        uzbek_meaning: 'Ishonarli, mantiqan to‘g‘ri ko‘ringan',
        english_definition: 'Seeming reasonable, probable, or worthy of belief.',
        example_sentence: 'The climatologist presented a plausible explanation for the sudden atmospheric shift.',
        level: 'B2',
        topic: 'Science & Research',
        collocations: ['plausible explanation', 'plausible alternative', 'hardly plausible']
      },
      {
        id: 'v-6',
        word: 'Detrimental',
        phonetic: '/ˌdet.rɪˈmen.təl/',
        uzbek_meaning: 'Zararli, salbiy oqibatlarga olib keluvchi',
        english_definition: 'Tending to cause harm or damage.',
        example_sentence: 'Excessive nocturnal screen time exerts a detrimental impact on cognitive retention.',
        level: 'B2',
        topic: 'Health & Psychology',
        collocations: ['detrimental effect', 'detrimental impact on', 'proven detrimental']
      }
    ];
    this.data.vocab_items.push(...vocabs);

    // Initial spaced repetition reviews for Azizbek
    this.data.vocab_reviews.push(
      {
        id: crypto.randomUUID(),
        profile_id: demoStudentId,
        vocab_id: 'v-1',
        mastery_level: 4,
        interval_days: 6,
        ease_factor: 2.6,
        next_review_at: new Date(Date.now() + 6 * 86400000).toISOString(),
        reviewed_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        profile_id: demoStudentId,
        vocab_id: 'v-4',
        mastery_level: 2,
        interval_days: 1,
        ease_factor: 2.3,
        next_review_at: new Date(Date.now() + 86400000).toISOString(),
        reviewed_at: new Date().toISOString()
      }
    );

    // 7. Rewards Catalog
    this.data.rewards.push(
      {
        id: 'rew-1',
        code: 'FIRST_STEP',
        name_uz: 'Birinchi Qadam',
        description_uz: 'Birinchi IELTS mashqini muvaffaqiyatli yakunladingiz',
        icon_name: 'Award',
        points: 50,
        criteria_type: 'first_test',
        criteria_value: 1
      },
      {
        id: 'rew-2',
        code: 'STREAK_7',
        name_uz: 'Haftalik Sabr-Toqat',
        description_uz: '7 kun uzluksiz kunlik dars rejasiga amal qilindi',
        icon_name: 'Flame',
        points: 150,
        criteria_type: 'streak',
        criteria_value: 7
      },
      {
        id: 'rew-3',
        code: 'READING_MASTER',
        name_uz: 'Akademik Mutolaa Ustasi',
        description_uz: 'Reading bo‘limida 3 ta to‘liq passage topshirildi',
        icon_name: 'BookOpen',
        points: 200,
        criteria_type: 'reading_tests',
        criteria_value: 3
      },
      {
        id: 'rew-4',
        code: 'ESSAY_PRO',
        name_uz: 'Mohir Insho Muallifi',
        description_uz: 'Writing Task 2 bo‘yicha to‘liq AI tahlilidan o‘tildi',
        icon_name: 'PenTool',
        points: 250,
        criteria_type: 'writing_submitted',
        criteria_value: 1
      }
    );

    // Award initial badge to demo student
    this.data.student_rewards.push({
      id: crypto.randomUUID(),
      profile_id: demoStudentId,
      reward_id: 'rew-1',
      awarded_at: new Date(Date.now() - 86400000 * 3).toISOString()
    });
    this.data.student_rewards.push({
      id: crypto.randomUUID(),
      profile_id: demoStudentId,
      reward_id: 'rew-2',
      awarded_at: new Date().toISOString()
    });

    // Initial completed attempt for demo student
    const sampleAttemptId = 'sample-attempt-read-1';
    this.data.attempts.push({
      id: sampleAttemptId,
      profile_id: demoStudentId,
      exercise_id: 'read-ex-1',
      status: 'submitted',
      started_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      deadline_at: new Date(Date.now() - 3600000 * 2 + 1200000).toISOString(),
      submitted_at: new Date(Date.now() - 3600000 * 2 + 890000).toISOString(),
      score: 3,
      total_questions: 4,
      band_estimate: 7.0,
      duration_seconds: 890
    });

    this.data.answers.push(
      { id: crypto.randomUUID(), attempt_id: sampleAttemptId, question_id: 'q-read-1', user_answer: 'FALSE', is_correct: true, saved_at: new Date().toISOString() },
      { id: crypto.randomUUID(), attempt_id: sampleAttemptId, question_id: 'q-read-2', user_answer: 'TRUE', is_correct: true, saved_at: new Date().toISOString() },
      { id: crypto.randomUUID(), attempt_id: sampleAttemptId, question_id: 'q-read-3', user_answer: 'FALSE', is_correct: false, saved_at: new Date().toISOString() },
      { id: crypto.randomUUID(), attempt_id: sampleAttemptId, question_id: 'q-read-4', user_answer: 'B) Structural reinforcement for soil loads and irrigation systems', is_correct: true, saved_at: new Date().toISOString() }
    );

    this.data.error_patterns.push({
      id: crypto.randomUUID(),
      profile_id: demoStudentId,
      skill: 'reading',
      category: 'inference_error',
      count: 1,
      latest_occurrence: new Date().toISOString(),
      last_attempt_id: sampleAttemptId,
      corrective_recommendation: 'Not Given qoidasi: agar matnda aniq fakt berilmagan bo‘lsa, shaxsiy taxminga tayanmang.'
    });

    this.data.learning_plans.push({
      id: crypto.randomUUID(),
      profile_id: demoStudentId,
      daily_objectives: [
        { day: 'Bugun', title: 'Reading: True/False/Not Given xatolarni tahlil qilish', skill: 'reading', duration_min: 25, completed: true },
        { day: 'Ertaga', title: 'Writing Task 2: AI ta’limda mavzusida insho yozish', skill: 'writing', duration_min: 40, completed: false },
        { day: 'Payshanba', title: 'Speaking Part 2: O‘tgan yutuq haqida 2-daqiqa gapirish', skill: 'speaking', duration_min: 20, completed: false },
        { day: 'Juma', title: 'Vocabulary: C1 darajadagi 10 ta akademik so‘z testi', skill: 'vocabulary', duration_min: 20, completed: false }
      ],
      weekly_milestones: [
        { week: 1, goal: 'Readingda 7.0 band darajasini mustahkamlash', target_band: 7.0, completed: true },
        { week: 2, goal: 'Writingda 250+ so‘z va 7.0 band strukturasini tuzish', target_band: 7.0, completed: false },
        { week: 3, goal: 'Speakingda ikkilanishlarsiz nutq va boy so‘z boyligi', target_band: 7.5, completed: false }
      ],
      recommended_exercises: ['writ-ex-1', 'spk-ex-1', 'gram-ex-1'],
      weak_skills: [
        { skill: 'Reading', error_count: 1, focus_area: 'Not Given vs False farqlash' }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    this.data.audit_events.push({
      id: crypto.randomUUID(),
      actor_id: 'system',
      actor_role: 'system',
      action: 'INIT_SEED',
      entity_type: 'database',
      entity_id: 'root',
      details: 'Tizim boshlang‘ich akademik IELTS materiallari va standart javoblar kaliti bilan ishga tushirildi.',
      timestamp: new Date().toISOString()
    });
  }
}

export const db = new Database();
