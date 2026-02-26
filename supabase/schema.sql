-- ============================================================
-- THE MICROBIOME CLINIC — Education Platform
-- Supabase Database Schema v1.0
-- Run this ONCE in Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- ============================================================

-- ============================================================
-- 1. CUSTOM TYPES
-- ============================================================

CREATE TYPE quiz_question_type AS ENUM (
  'multiple_choice',
  'true_false',
  'multi_select'
);

CREATE TYPE question_status AS ENUM (
  'pending',
  'answered',
  'archived'
);

-- ============================================================
-- 2. PROFILES TABLE
-- Extends Supabase auth.users with app-specific data
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  practice_name TEXT,
  ahpra_number TEXT,           -- Australian GP registration number
  state TEXT,                  -- AU state/territory
  has_course_access BOOLEAN DEFAULT FALSE,
  shopify_order_id TEXT,       -- Links back to Shopify purchase
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. MODULES TABLE
-- The 9 course modules
-- ============================================================

CREATE TABLE modules (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,           -- e.g. 'why-this-matters'
  title TEXT NOT NULL,                 -- e.g. 'Why This Matters — The Case for Microbiome Medicine'
  subtitle TEXT,                       -- Short description
  purpose TEXT,                        -- Module purpose statement
  practitioner_mindset TEXT,           -- The mindset shift quote
  module_number INTEGER UNIQUE NOT NULL,
  has_quiz BOOLEAN DEFAULT FALSE,
  has_question_form BOOLEAN DEFAULT TRUE,
  chapter_count INTEGER DEFAULT 0,
  estimated_reading_minutes INTEGER,
  icon TEXT,                           -- Icon identifier or emoji
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. CHAPTERS TABLE
-- Individual chapters within modules (56+)
-- ============================================================

CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,                  -- e.g. 'about-dr-froomes'
  title TEXT NOT NULL,
  subtitle TEXT,                       -- Brief chapter description
  chapter_number INTEGER NOT NULL,     -- Order within the module
  content_html TEXT,                   -- The actual chapter content (rich HTML)
  content_markdown TEXT,               -- Markdown source (for editing)
  key_takeaways JSONB,                -- Array of takeaway strings
  clinical_application TEXT,           -- How this applies in GP practice
  "references" JSONB,                   -- Array of {title, url, journal, year}
  downloadable_resources JSONB,        -- Array of {title, filename, url, type}
  estimated_reading_minutes INTEGER DEFAULT 12,
  has_inline_quiz BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, chapter_number),
  UNIQUE(module_id, slug)
);

-- ============================================================
-- 5. QUIZZES TABLE
-- End-of-module quizzes (7 modules have them)
-- ============================================================

CREATE TABLE quizzes (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,    -- Percentage (no gatekeeping, just informational)
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. QUIZ QUESTIONS TABLE
-- ============================================================

CREATE TABLE quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE SET NULL,  -- Optional: link to source chapter
  question_type quiz_question_type NOT NULL DEFAULT 'multiple_choice',
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,              -- Array of {id, text, is_correct}
  explanation TEXT,                    -- Shown after answering
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. USER PROGRESS TABLE
-- Tracks chapter completion per user
-- ============================================================

CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0,
  UNIQUE(user_id, chapter_id)
);

-- ============================================================
-- 8. QUIZ ATTEMPTS TABLE
-- Stores each quiz attempt with score
-- ============================================================

CREATE TABLE quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,              -- Percentage
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  answers JSONB,                       -- {question_id: selected_option_id}
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. QUESTION SUBMISSIONS TABLE
-- Practitioner questions submitted at end of each module
-- ============================================================

CREATE TABLE question_submissions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  status question_status DEFAULT 'pending',
  admin_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_chapters_module ON chapters(module_id, chapter_number);
CREATE INDEX idx_progress_user ON user_progress(user_id);
CREATE INDEX idx_progress_chapter ON user_progress(chapter_id);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id, order_index);
CREATE INDEX idx_question_submissions_module ON question_submissions(module_id);
CREATE INDEX idx_question_submissions_status ON question_submissions(status);

-- ============================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- Users can only see/edit their own data
-- ============================================================

-- Enable RLS on all user-facing tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Modules: anyone authenticated with course access can read
CREATE POLICY "Authenticated users can view published modules"
  ON modules FOR SELECT
  USING (
    is_published = TRUE
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.has_course_access = TRUE
    )
  );

-- Chapters: anyone with course access can read published chapters
CREATE POLICY "Authenticated users can view published chapters"
  ON chapters FOR SELECT
  USING (
    is_published = TRUE
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.has_course_access = TRUE
    )
  );

-- Quizzes: anyone with course access can read
CREATE POLICY "Authenticated users can view published quizzes"
  ON quizzes FOR SELECT
  USING (
    is_published = TRUE
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.has_course_access = TRUE
    )
  );

-- Quiz questions: anyone with course access can read
CREATE POLICY "Authenticated users can view quiz questions"
  ON quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.has_course_access = TRUE
    )
  );

-- Progress: users can CRUD their own progress
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Quiz attempts: users can read/insert their own
CREATE POLICY "Users can view own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Question submissions: users can read/insert their own
CREATE POLICY "Users can view own submissions"
  ON question_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit questions"
  ON question_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 12. AUTO-CREATE PROFILE ON SIGNUP
-- Trigger that creates a profile row when a new user signs up
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 13. AUTO-UPDATE TIMESTAMPS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 14. SEED DATA — THE 9 MODULES
-- ============================================================

INSERT INTO modules (module_number, slug, title, subtitle, purpose, practitioner_mindset, has_quiz, chapter_count, estimated_reading_minutes, icon) VALUES
(1, 'why-this-matters', 
   'Why This Matters — The Case for Microbiome Medicine',
   'The problem we''re solving',
   'Emotional and intellectual buy-in. Establish credibility, define the problem, make the practitioner feel the urgency.',
   'I didn''t realise how big this problem is or how badly these patients are being served — and I can do something about it.',
   TRUE, 6, 90, '🔬'),

(2, 'microbiome-foundations',
   'The Microbiome — Foundations',
   'What the microbiome is and why it matters',
   'Scientific foundation. What the microbiome is, what it does, what damages it, and why it matters clinically.',
   'Now I understand what''s actually happening in the gut and why my patients are sick.',
   TRUE, 6, 90, '🧬'),

(3, 'microbiome-and-disease',
   'The Microbiome & Disease — IBS, SIBO & the Gut–Brain Axis',
   'Connecting science to conditions GPs see every day',
   'The core clinical module. Connect microbiome science to conditions GPs see every day.',
   'The evidence is compelling — I can see this in my own patient population.',
   TRUE, 7, 105, '🩺'),

(4, 'diagnosis',
   'Diagnosis — The Microbiome Clinic Stool Test',
   'What the test shows and why to order through us',
   'Position the clinic''s testing service as the gold standard. Make the case for end-to-end clinical value.',
   'I know exactly what this test shows me, I know its limitations, and I know why I should order through the clinic.',
   TRUE, 5, 75, '🔎'),

(5, 'treatment',
   'Treatment — The Repair Protocol',
   'The evidence-based treatment framework',
   'The action module and primary conversion point. Every ingredient claim backed by research.',
   'I have a concrete, evidence-based framework and I trust it.',
   TRUE, 8, 120, '💊'),

(6, 'consultation-guide',
   'The Consultation Guide — Implementing in Practice',
   'How to run microbiome consultations in 15 minutes',
   'Bridge the gap between knowledge and action. Teach the GP exactly how to run microbiome-focused consultations.',
   'I know exactly what to say, what to do, and when to refer.',
   TRUE, 6, 90, '📋'),

(7, 'case-studies',
   'Case Studies — Real Patients, Real Outcomes',
   'De-identified case walkthroughs',
   'Show, don''t tell. De-identified case walkthroughs demonstrating the full patient journey.',
   'I''ve seen it work across different presentations. I can picture doing this.',
   FALSE, 6, 90, '📊'),

(8, 'beyond-ibs',
   'Beyond IBS — The Microbiome Across Body Systems',
   'Broader applications and referral pathways',
   'Broaden understanding and establish the referral pathway. Most conditions here are NOT for GP-level treatment.',
   'This is bigger than I thought. And I know exactly when and where to refer.',
   TRUE, 7, 105, '🌐'),

(9, 'working-with-us',
   'Working With Us — Referral, Resources & Ongoing Support',
   'How to refer, order, and stay connected',
   'Make the practitioner–clinic partnership frictionless. Turn a course completer into an active referring practitioner.',
   'I know exactly how to refer, how to order, and who to call.',
   FALSE, 5, 60, '🤝');

-- ============================================================
-- 15. SEED DATA — ALL 56 CHAPTERS
-- ============================================================

-- Module 1: Why This Matters (6 chapters)
INSERT INTO chapters (module_id, chapter_number, slug, title, subtitle, estimated_reading_minutes) VALUES
(1, 1, 'about-dr-froomes', 'About Dr Paul Froomes & The Microbiome Clinic', 'Credentials, experience, and why this course exists', 12),
(1, 2, 'functional-gut-disorders', 'What Are Functional Gut Disorders?', 'Rome IV criteria and everyday GP presentations', 15),
(1, 3, 'scale-of-the-problem', 'The Scale of the Problem', 'Australian and global prevalence data', 12),
(1, 4, 'patient-experience', 'The Patient Experience', 'The revolving door and decades of invalidation', 12),
(1, 5, 'system-is-failing', 'Why the Current System Is Failing — and It Starts with Testing', 'The diagnostic gap in standard pathology', 15),
(1, 6, 'the-opportunity', 'The Opportunity — What This Course Will Give You', 'Course roadmap and what you''ll be able to do', 10);

-- Module 2: The Microbiome — Foundations (6 chapters)
INSERT INTO chapters (module_id, chapter_number, slug, title, subtitle, estimated_reading_minutes) VALUES
(2, 1, 'what-is-the-microbiome', 'What Is the Microbiome?', 'Definition, composition, scale', 15),
(2, 2, 'why-microbiome-matters', 'Why the Microbiome Matters — Your Patient''s Mini-Pharmacy', 'Vitamins, neurotransmitters, SCFAs, immune regulation', 15),
(2, 3, 'good-bad-missing', 'The Good, the Bad, and the Missing', 'Beneficial bacteria, dysbiotic bacteria, and why what''s missing matters', 15),
(2, 4, 'dysbiosis', 'Dysbiosis — When the Microbiome Goes Wrong', 'Causes, clinical presentation, progression', 12),
(2, 5, 'modern-microbiomes-damaged', 'Why Modern Microbiomes Are So Damaged', 'Antibiotics, processed food, environmental factors, generational decline', 15),
(2, 6, 'dysbiosis-and-inflammation', 'Dysbiosis and Inflammation — The Mechanism', 'Cytokines, gut wall damage, LPS, molecular mimicry', 15);

-- Module 3: The Microbiome & Disease (7 chapters)
INSERT INTO chapters (module_id, chapter_number, slug, title, subtitle, estimated_reading_minutes) VALUES
(3, 1, 'ibs-microbiome-disorder', 'IBS — A Microbiome Disorder', 'Reframing IBS with evidence from 125+ papers', 15),
(3, 2, 'sibo', 'SIBO — Small Intestinal Bacterial Overgrowth', 'Definition, pathophysiology, overlap with IBS', 15),
(3, 3, 'gut-brain-axis', 'The Gut–Brain Axis', 'Vagus nerve, enteric nervous system, bidirectional communication', 12),
(3, 4, 'anxiety-depression', 'Anxiety, Depression & the Microbiome', 'Serotonin, GABA, dopamine and psychobiotics research', 15),
(3, 5, 'red-flags', 'Red Flags — When It''s Not IBS', 'Alarm symptoms and differential diagnosis', 12),
(3, 6, 'stool-testing-reveals', 'Stool Testing — What It Reveals', 'Microbiome testing vs standard pathology', 15),
(3, 7, 'reading-stool-test', 'Reading a Stool Test Report — What It Can and Can''t Tell You', 'Annotated report walkthrough with honest framing', 15);

-- Module 4: Diagnosis (5 chapters)
INSERT INTO chapters (module_id, chapter_number, slug, title, subtitle, estimated_reading_minutes) VALUES
(4, 1, 'standard-pathology-gaps', 'Why Standard Pathology Misses Dysbiosis', 'What conventional panels measure and what they don''t', 15),
(4, 2, 'tmc-stool-test', 'The Microbiome Clinic Stool Test — What You Get', 'Methodology, species covered, what makes it different', 15),
(4, 3, 'interpreting-results', 'Interpreting Results — What the Report Can and Can''t Tell You', 'Annotated real report walkthrough', 15),
(4, 4, 'report-to-decision', 'From Report to Clinical Decision', 'Combining testing with clinical picture', 12),
(4, 5, 'why-order-through-tmc', 'Why Order Through The Microbiome Clinic', 'The end-to-end value of specialist interpretation and support', 12);

-- Module 5: Treatment (8 chapters)
INSERT INTO chapters (module_id, chapter_number, slug, title, subtitle, estimated_reading_minutes) VALUES
(5, 1, 'treatment-philosophy', 'Treatment Philosophy — The Two-Step Principle', 'Remove then replant, and why single interventions fail', 15),
(5, 2, 'why-antibiotics-alone-fail', 'Why Antibiotics Alone Don''t Work', 'Non-selective action and recurrence without restoration', 12),
(5, 3, 'why-probiotics-alone-fail', 'Why Probiotics Alone Don''t Work', 'Planting flowers in a weed-infested garden', 12),
(5, 4, 'repair-protocol-overview', 'The Repair-4 Protocol — Overview', 'Complete framework, three phases, 30 years of refinement', 15),
(5, 5, 'phase-1-clear', 'Phase I — Clear the Overgrowth', 'Every ingredient with purpose and supporting research', 18),
(5, 6, 'phase-2-restore', 'Phase II — Restore the Microbiome', 'Restoration after cleared terrain', 18),
(5, 7, 'phase-3-maintain', 'Phase III — Maintain', 'Why ongoing support is essential', 12),
(5, 8, 'how-to-order', 'How to Order & Get Started', 'Ordering process, pricing, logistics, clinical support', 10);

-- Module 6: Consultation Guide (6 chapters)
INSERT INTO chapters (module_id, chapter_number, slug, title, subtitle, estimated_reading_minutes) VALUES
(6, 1, 'consultation-overview', 'Consultation Guide Overview', 'How this integrates with existing practice', 12),
(6, 2, 'initial-consultation', 'The Initial Consultation', 'Patient history, symptom assessment, ordering testing', 15),
(6, 3, 'results-consultation', 'The Results Consultation', 'Presenting results and framing the treatment plan', 15),
(6, 4, 'post-treatment-review', 'Post-Treatment Review', 'Reviewing response, adjusting protocol', 12),
(6, 5, 'post-maintenance', 'Post-Maintenance & Long-Term Follow-Up', 'Long-term outcomes and when to re-treat', 12),
(6, 6, 'sceptical-patients', 'Talking to Sceptical Patients & Managing Difficult Conversations', 'Handling doubt, slow timelines, and when to change course', 12);

-- Module 7: Case Studies (6 chapters)
INSERT INTO chapters (module_id, chapter_number, slug, title, subtitle, estimated_reading_minutes) VALUES
(7, 1, 'ibs-c-case', 'IBS-C Patient Walkthrough', 'Full case: presentation to resolution', 15),
(7, 2, 'ibs-d-case', 'IBS-D Patient Walkthrough', 'Different presentation, same framework', 15),
(7, 3, 'ibs-mixed-case', 'IBS-Mixed Patient Walkthrough', 'The most common and frustrating subtype', 15),
(7, 4, 'complex-case', 'Complex Case — Gut, Skin & Mood', 'Multi-system microbiome impact', 15),
(7, 5, 'vaginal-microbiome-case', 'Recurrent Thrush/BV — A Vaginal Microbiome Case', 'Women''s health pathway demonstration', 15),
(7, 6, 'when-treatment-fails', 'When Treatment Doesn''t Go to Plan', 'Adjustment, escalation, and clinical honesty', 12);

-- Module 8: Beyond IBS (7 chapters)
INSERT INTO chapters (module_id, chapter_number, slug, title, subtitle, estimated_reading_minutes) VALUES
(8, 1, 'leaky-gut-autoimmune', 'Leaky Gut, Immune Activation & Autoimmune Disease', 'Intestinal permeability and molecular mimicry', 15),
(8, 2, 'gut-skin-axis', 'The Gut–Skin Axis', 'Acne, eczema, psoriasis, rosacea', 12),
(8, 3, 'weight-metabolism', 'Weight, Metabolism & the Microbiome', 'Bacterial profiles in obesity vs lean composition', 12),
(8, 4, 'cardiovascular', 'Cardiovascular Disease & the Microbiome', 'TMAO production and gut–heart research', 12),
(8, 5, 'cancer', 'The Microbiome & Cancer', 'Immune surveillance and bacterial signatures', 12),
(8, 6, 'womens-health', 'Women''s Health — Vaginal, Urinary & Hormonal Connections', 'The one area GPs CAN treat and manage', 18),
(8, 7, 'emerging-frontiers', 'Emerging & Established Frontiers', 'FMT, neurodegeneration, fertility, paediatrics', 15);

-- Module 9: Working With Us (5 chapters)
INSERT INTO chapters (module_id, chapter_number, slug, title, subtitle, estimated_reading_minutes) VALUES
(9, 1, 'how-to-refer', 'How to Refer a Patient to The Microbiome Clinic', 'Step-by-step referral process', 10),
(9, 2, 'how-to-order-testing', 'How to Order Testing for Your Patients', 'Ordering process and sample collection', 10),
(9, 3, 'dietary-guidance', 'Dietary Guidance You Can Provide Now', 'Low FODMAP overview and practical guidance', 12),
(9, 4, 'monthly-qa', 'Monthly Q&A with Dr Froomes', 'How the ongoing Q&A works', 8),
(9, 5, 'newsletter-whats-next', 'Dr Froomes'' Weekly Newsletter & What''s Coming Next', 'Staying connected with the clinic', 8);


-- ============================================================
-- 16. HELPER VIEW — Module progress summary per user
-- ============================================================

CREATE OR REPLACE VIEW user_module_progress AS
SELECT
  p.user_id,
  m.id AS module_id,
  m.module_number,
  m.title AS module_title,
  m.chapter_count AS total_chapters,
  COUNT(CASE WHEN p.completed_at IS NOT NULL THEN 1 END) AS completed_chapters,
  ROUND(
    COUNT(CASE WHEN p.completed_at IS NOT NULL THEN 1 END)::NUMERIC / 
    NULLIF(m.chapter_count, 0) * 100
  ) AS completion_percentage
FROM modules m
CROSS JOIN (SELECT DISTINCT user_id FROM user_progress) AS users(user_id)
LEFT JOIN chapters c ON c.module_id = m.id
LEFT JOIN user_progress p ON p.chapter_id = c.id AND p.user_id = users.user_id
GROUP BY p.user_id, m.id, m.module_number, m.title, m.chapter_count
ORDER BY m.module_number;


-- ============================================================
-- DONE! Your database is ready.
-- Next: Set up authentication in Supabase Dashboard:
--   1. Go to Authentication → Providers → Enable Email
--   2. Go to Authentication → URL Configuration → Set site URL
--   3. Optionally enable "Confirm email" for production
-- ============================================================
