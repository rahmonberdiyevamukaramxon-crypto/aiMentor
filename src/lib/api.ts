import { Profile, Exercise, Question, Attempt, AIFeedback, VocabItem, Reward, LearningPlan, ChatMessage } from '../types';

const TOKEN_KEY = 'ielts_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Serverda kutilmagan xatolik yuz berdi');
  }

  return data as T;
}

export const api = {
  // Auth
  register: (first_name: string, last_name: string, age: number, pin: string) =>
    request<{ token: string; profile: Profile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ first_name, last_name, age, pin }),
    }),

  login: (credentials: { student_id?: string; first_name?: string; last_name?: string; pin: string }) =>
    request<{ token: string; profile: Profile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () => request<{ profile: Profile }>('/auth/me'),

  updateProfile: (updates: Partial<Profile>) =>
    request<{ profile: Profile }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Plan & Diagnostic
  getPlan: () => request<{ plan: LearningPlan }>('/plan'),

  submitDiagnostic: (data: any) =>
    request<{ message: string; plan: LearningPlan }>('/plan/diagnostic', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Exercises & Timed Exams
  getExercises: (skill?: string) =>
    request<{ exercises: Exercise[] }>(`/exercises${skill ? `?skill=${skill}` : ''}`),

  getExercise: (id: string) =>
    request<{ exercise: Exercise; questions: Question[] }>(`/exercises/${id}`),

  startAttempt: (exerciseId: string) =>
    request<{ attempt: Attempt; exercise: Exercise; questions: Question[]; server_time: string }>(
      `/exercises/${exerciseId}/start`,
      { method: 'POST' }
    ),

  getAttempt: (attemptId: string) =>
    request<{
      attempt: Attempt;
      exercise: Exercise;
      answers: { question_id: string; user_answer: string }[];
      details: { question: Question; user_answer: string; is_correct: boolean }[];
      server_time: string;
    }>(`/attempts/${attemptId}`),

  saveAnswer: (attemptId: string, questionId: string, userAnswer: string) =>
    request<{ answer: any }>(`/attempts/${attemptId}/save-answer`, {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, user_answer: userAnswer }),
    }),

  submitAttempt: (attemptId: string, userTextResponse?: string) =>
    request<{
      attempt: Attempt;
      score: number;
      total: number;
      band_estimate: number;
      details: { question: Question; user_answer: string; is_correct: boolean }[];
    }>(`/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ user_text_response: userTextResponse }),
    }),

  // AI Tutor & Evaluations
  chatTutor: (message: string, skill_context?: string) =>
    request<{ reply: ChatMessage }>('/ai/tutor', {
      method: 'POST',
      body: JSON.stringify({ message, skill_context }),
    }),

  streamTutor: async (
    message: string,
    skill_context: string | undefined,
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (err: any) => void
  ) => {
    try {
      const token = getStoredToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/ai/tutor/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, skill_context }),
      });

      if (!response.ok) {
        throw new Error('Serverdan javob olishda xatolik yuz berdi');
      }

      if (!response.body) {
        throw new Error('Javob oqimi mavjud emas');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              onDone();
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                onChunk(parsed.text);
              } else if (parsed.error) {
                onError(new Error(parsed.error));
                return;
              }
            } catch {
              // ignore parse errors for chunks
            }
          }
        }
      }
      onDone();
    } catch (err: any) {
      onError(err);
    }
  },

  getChatHistory: () =>
    request<{ messages: ChatMessage[] }>('/ai/chat-history'),

  evaluateWriting: (task_prompt: string, student_essay: string, attempt_id?: string) =>
    request<{ evaluation: any; feedback?: AIFeedback }>('/ai/evaluate-writing', {
      method: 'POST',
      body: JSON.stringify({ task_prompt, student_essay, attempt_id }),
    }),

  evaluateSpeaking: (prompt_card: string, transcript: string, attempt_id?: string) =>
    request<{ evaluation: any; feedback?: AIFeedback }>('/ai/evaluate-speaking', {
      method: 'POST',
      body: JSON.stringify({ prompt_card, transcript, attempt_id }),
    }),

  // Vocabulary & Spaced Repetition
  getVocabulary: () =>
    request<{ items: VocabItem[] }>('/vocabulary'),

  reviewVocabulary: (id: string, quality: number) =>
    request<{ review: any }>(`/vocabulary/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ quality }),
    }),

  // Analytics & Rewards
  getAnalytics: () =>
    request<{
      profile: any;
      skill_estimates: Record<string, number>;
      activity: { total_attempts: number; completed_attempts: number; accuracy_percentage: number; recent_attempts: Attempt[] };
      error_patterns: any[];
      rewards: any[];
    }>('/progress/analytics'),

  getRewards: () =>
    request<{ rewards: Reward[] }>('/rewards'),

  // Admin
  getAdminOverview: () =>
    request<{
      total_students: number;
      total_exercises: number;
      students: any[];
      recent_audit: any[];
    }>('/admin/overview'),

  createAdminExercise: (exerciseData: any) =>
    request<{ exercise: Exercise }>('/admin/exercises', {
      method: 'POST',
      body: JSON.stringify(exerciseData),
    }),

  // Audio & Listening
  getExerciseAudioUrl: (exerciseId: string) => `/api/audio/exercise/${exerciseId}`,
  getTestSoundUrl: () => `/api/audio/test-sound`,
};
