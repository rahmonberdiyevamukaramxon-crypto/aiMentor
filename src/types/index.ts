export interface Profile {
  id: string;
  role: 'student' | 'admin';
  first_name: string;
  last_name: string;
  age: number;
  target_band: number;
  current_level: string;
  exam_date?: string;
  study_hours_per_day: number;
  intensity: 'light' | 'moderate' | 'intensive';
  streak_days: number;
  total_study_minutes: number;
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

export interface Question {
  id: string;
  exercise_id: string;
  question_number: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false_not_given' | 'yes_no_not_given' | 'matching_headings' | 'summary_completion' | 'short_answer';
  options?: string[];
  correct_answer?: string;
  explanation_uz?: string;
  evidence_passage?: string;
  error_category?: string;
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
  review?: {
    mastery_level: number;
    next_review_at: string;
    interval_days: number;
  } | null;
}

export interface Reward {
  id: string;
  code: string;
  name_uz: string;
  description_uz: string;
  icon_name: string;
  points: number;
  criteria_type: string;
  criteria_value: number;
  is_earned?: boolean;
  earned_at?: string | null;
}

export interface LearningPlan {
  id: string;
  profile_id: string;
  daily_objectives: { day: string; title: string; skill: string; duration_min: number; completed: boolean }[];
  weekly_milestones: { week: number; goal: string; target_band: number; completed: boolean }[];
  recommended_exercises: string[];
  weak_skills: { skill: string; error_count: number; focus_area: string }[];
}

export interface ChatMessage {
  id: string;
  profile_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  skill_context?: string;
}
