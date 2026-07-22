-- B2 GEO/SEO Analyzer — Schema inicial do PostgreSQL
-- @see docs/08_MODELO_DE_DADOS.md

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──── Identity & Access ────

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan_key VARCHAR(50) DEFAULT 'starter',
  status VARCHAR(20) DEFAULT 'active',
  brand_settings JSONB DEFAULT '{}',
  data_region VARCHAR(10) DEFAULT 'br',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  locale VARCHAR(10) DEFAULT 'pt-BR',
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE organization_members (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('owner','admin','analyst','editor','viewer','billing')),
  status VARCHAR(20) DEFAULT 'active',
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

-- ──── Projects ────

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  primary_domain VARCHAR(500),
  country_code VARCHAR(5) DEFAULT 'BR',
  language_code VARCHAR(10) DEFAULT 'pt-BR',
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  company_profile JSONB DEFAULT '{}',
  crawl_settings JSONB DEFAULT '{}',
  score_settings JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN ('brand','product','service','region','sector','person','competitor','certification')),
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255) NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  is_confirmed BOOLEAN DEFAULT false,
  source VARCHAR(20) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──── URLs ────

CREATE TABLE urls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  normalized_url VARCHAR(2048) NOT NULL,
  url_hash VARCHAR(64) NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  page_type VARCHAR(50),
  importance SMALLINT DEFAULT 3,
  status VARCHAR(20) DEFAULT 'active',
  UNIQUE(project_id, url_hash)
);

-- ──── Analysis ────

CREATE TABLE analysis_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url_id UUID REFERENCES urls(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('page','domain','ai_visibility','integration')),
  source VARCHAR(20) NOT NULL CHECK (source IN ('extension','dashboard','schedule','api')),
  status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued','running','partial_complete','completed','failed','cancelled')),
  requested_modules TEXT[] DEFAULT '{}',
  completed_modules TEXT[] DEFAULT '{}',
  ruleset_versions JSONB DEFAULT '{}',
  progress SMALLINT DEFAULT 0,
  coverage DECIMAL(5,3) DEFAULT 0,
  confidence SMALLINT DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  correlation_id UUID,
  error_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE analysis_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  module_key VARCHAR(50) NOT NULL,
  module_version VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed','cancelled','skipped')),
  coverage DECIMAL(5,3) DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  attempts SMALLINT DEFAULT 0,
  error_code VARCHAR(50),
  error_message TEXT,
  metrics JSONB DEFAULT '{}'
);

CREATE TABLE page_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  url_id UUID REFERENCES urls(id),
  capture_source VARCHAR(30) NOT NULL,
  final_url VARCHAR(2048),
  http_status SMALLINT,
  content_type VARCHAR(100),
  source_hash VARCHAR(64),
  rendered_hash VARCHAR(64),
  facts JSONB DEFAULT '{}',
  source_artifact_id UUID,
  rendered_artifact_id UUID,
  screenshot_artifact_id UUID,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days'
);

-- ──── Findings & Scores ────

CREATE TABLE findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  url_id UUID REFERENCES urls(id),
  rule_key VARCHAR(100) NOT NULL,
  rule_version VARCHAR(20) NOT NULL,
  score_type VARCHAR(20) NOT NULL CHECK (score_type IN ('seo','geo','ai_visibility')),
  category_key VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PASS','FAIL','WARN','INFO','NOT_APPLICABLE','NOT_TESTED','UNKNOWN','ERROR')),
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('critical','high','medium','low','info')),
  title VARCHAR(500) NOT NULL,
  explanation TEXT,
  impact_text TEXT,
  remediation_text TEXT,
  acceptance_criteria TEXT,
  quality_ratio DECIMAL(5,3) DEFAULT 0,
  points_available DECIMAL(8,3) DEFAULT 0,
  points_earned DECIMAL(8,3) DEFAULT 0,
  confidence DECIMAL(5,3) DEFAULT 0,
  effort SMALLINT DEFAULT 3,
  priority VARCHAR(3) DEFAULT 'P3' CHECK (priority IN ('P0','P1','P2','P3','P4')),
  cause_group VARCHAR(100),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evidences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  source VARCHAR(30),
  selector TEXT,
  excerpt TEXT,
  attribute_name VARCHAR(100),
  attribute_value TEXT,
  artifact_id UUID,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  score_type VARCHAR(20) NOT NULL CHECK (score_type IN ('seo','geo','ai_visibility')),
  ruleset_version VARCHAR(20) NOT NULL,
  score SMALLINT NOT NULL DEFAULT 0,
  coverage DECIMAL(5,3) DEFAULT 0,
  confidence SMALLINT DEFAULT 0,
  categories JSONB DEFAULT '[]',
  gates JSONB DEFAULT '[]',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(analysis_run_id, score_type)
);

-- ──── Action Plans ────

CREATE TABLE action_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_analysis_run_id UUID REFERENCES analysis_runs(id),
  name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES users(id),
  settings JSONB DEFAULT '{}'
);

CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_plan_id UUID NOT NULL REFERENCES action_plans(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES findings(id),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  discipline VARCHAR(30) NOT NULL,
  priority VARCHAR(3) DEFAULT 'P3' CHECK (priority IN ('P0','P1','P2','P3','P4')),
  impact SMALLINT DEFAULT 3 CHECK (impact BETWEEN 1 AND 5),
  effort SMALLINT DEFAULT 3 CHECK (effort BETWEEN 1 AND 5),
  urgency SMALLINT DEFAULT 3 CHECK (urgency BETWEEN 1 AND 5),
  confidence DECIMAL(5,3) DEFAULT 0.5,
  estimated_score_gain DECIMAL(8,3) DEFAULT 0,
  owner_user_id UUID REFERENCES users(id),
  due_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','ignored','not_applicable')),
  acceptance_criteria TEXT,
  source_type VARCHAR(20) DEFAULT 'finding',
  manual_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──── Rulesets ────

CREATE TABLE rulesets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  score_type VARCHAR(20) NOT NULL CHECK (score_type IN ('seo','geo','ai_visibility')),
  status VARCHAR(20) DEFAULT 'draft',
  effective_at TIMESTAMPTZ,
  definition JSONB NOT NULL DEFAULT '{}',
  changelog TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key, version)
);

-- ──── Audit ────

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_hash VARCHAR(64),
  user_agent_summary VARCHAR(200),
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──── Indexes ────

CREATE INDEX idx_projects_org ON projects(organization_id, status);
CREATE INDEX idx_analysis_runs_project ON analysis_runs(project_id, created_at DESC);
CREATE INDEX idx_analysis_runs_org_status ON analysis_runs(organization_id, status);
CREATE INDEX idx_findings_run_severity ON findings(analysis_run_id, severity, status);
CREATE INDEX idx_findings_project_rule ON findings(project_id, rule_key, created_at DESC);
CREATE INDEX idx_scores_run_type ON scores(analysis_run_id, score_type);
CREATE INDEX idx_action_items_plan_status ON action_items(action_plan_id, status, priority);
CREATE INDEX idx_audit_logs_org_time ON audit_logs(organization_id, occurred_at DESC);