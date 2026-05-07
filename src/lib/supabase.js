// Supabase client stub.
// In production, replace with: import { createClient } from '@supabase/supabase-js'
// and: export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
//
// ─────────────────────────────────────────────────────────────────────────────
// BACKEND CONTRACT — extension to the SKILL.md schema
// ─────────────────────────────────────────────────────────────────────────────
// In addition to the tables already defined in SKILL.md (users, courses,
// learning_paths, assignments, quiz_attempts, audit_log, certificates,
// esignatures), this build adds:
//
//   create table questions (
//     id uuid primary key default gen_random_uuid(),
//     course_id uuid references courses(id) on delete cascade,
//     type text check (type in ('mcq','multi','scenario','free-text','hotspot','drag-drop')) not null,
//     text_en text not null,
//     text_ar text,
//     options jsonb,            -- [{ id, text_en, text_ar }]
//     correct_answers jsonb,    -- [option_id, ...]    or [option_id] for mcq
//     explanation_en text,
//     explanation_ar text,
//     difficulty text default 'medium',
//     source text default 'manual',           -- 'manual' | 'ai-generated'
//     model text,                              -- 'claude-opus-4-7' when ai-generated
//     status text default 'draft',             -- 'draft' | 'pending-review' | 'approved' | 'archived'
//     reviewed_by uuid references users(id),
//     reviewed_at timestamptz,
//     created_by uuid references users(id),
//     created_at timestamptz default now()
//   );
//
//   create index idx_questions_course on questions(course_id, status);
//
//   alter table questions enable row level security;
//   create policy questions_admin_all on questions
//     for all using (auth.uid() in (select id from users where role = 'admin'));
//   create policy questions_learner_read on questions
//     for select using (status = 'approved');
//
// And one additional column on courses for content references:
//
//   alter table courses add column content_type text;     -- 'pdf'|'video'|'youtube'|'audio'|'ppt'|'doc'|'scorm'
//   alter table courses add column content_filename text;
//   alter table courses add column content_size bigint;
//   alter table courses add column youtube_id text;
//
// Storage bucket layout (Supabase Storage):
//   medlearn-content/
//     {course_id}/
//       {original_filename}               -- raw uploaded file (PDF, MP4, etc.)
//       transcripts/{filename}.txt        -- Whisper / yt-transcript output
//       thumbnails/{filename}.jpg
//
// AI-question generation pipeline (server-side):
//   POST /api/courses/{id}/generate-assessment
//     1. Fetch course + content from storage
//     2. Extract text:
//          - pdf  → pdfjs-dist
//          - docx → mammoth
//          - pptx → officegen / python-pptx
//          - video/audio → OpenAI Whisper or Deepgram
//          - youtube → youtube-transcript-api (en, ar fallback)
//          - scorm → unzip + read manifest + extract HTML
//     3. Send to Claude (claude-opus-4-7) with the assessment prompt
//     4. Validate JSON, persist to questions with status='pending-review'
//     5. Return to admin for approval; on approve, status='approved' and
//        an audit_log row is written.
// ─────────────────────────────────────────────────────────────────────────────

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
const isConfigured = Boolean(url && key)

const fakeFrom = (table) => ({
  select: async () => ({ data: [], error: null, table }),
  insert: async (row) => ({ data: row, error: null, table }),
  update: async (patch) => ({ data: patch, error: null, table }),
  delete: async () => ({ data: null, error: null, table }),
  eq: () => fakeFrom(table),
  order: () => fakeFrom(table),
  limit: () => fakeFrom(table),
})

export const supabase = {
  isConfigured,
  from: (table) => fakeFrom(table),
  auth: {
    signInWithPassword: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
  },
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
}

export const getClientIP = async () => '10.0.0.42'
