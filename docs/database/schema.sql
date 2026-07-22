-- B2 GEO/SEO Analyzer — esquema inicial PostgreSQL
-- Draft para migrações; revisar tipos, RLS e extensões antes de produção.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE member_role AS ENUM ('owner','admin','analyst','editor','viewer','billing');
CREATE TYPE record_status AS ENUM ('active','archived','pending_deletion');
CREATE TYPE analysis_type AS ENUM ('page','domain','ai_visibility','integration');
CREATE TYPE analysis_source AS ENUM ('extension','dashboard','schedule','api');
CREATE TYPE run_status AS ENUM ('queued','running','partial','completed','failed','cancelling','cancelled');
CREATE TYPE finding_status AS ENUM ('pass','fail','warn','info','not_applicable','not_tested','unknown','error');
CREATE TYPE severity_level AS ENUM ('critical','high','medium','low','info');
CREATE TYPE score_type AS ENUM ('seo','geo','ai_visibility','discoverability');
CREATE TYPE action_status AS ENUM ('open','in_progress','blocked','done','ignored');
CREATE TYPE action_priority AS ENUM ('P0','P1','P2','P3','P4');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  status record_status NOT NULL DEFAULT 'active',
  locale text NOT NULL DEFAULT 'pt-BR',
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  plan_key text NOT NULL DEFAULT 'starter',
  status record_status NOT NULL DEFAULT 'active',
  brand_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  data_region text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE organization_members (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role member_role NOT NULL,
  status record_status NOT NULL DEFAULT 'active',
  invited_by uuid REFERENCES users(id),
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  primary_domain text NOT NULL,
  country_code char(2) NOT NULL,
  language_code text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  company_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  crawl_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  score_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  status record_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, primary_domain)
);

CREATE INDEX idx_projects_org_status ON projects(organization_id, status);

CREATE TABLE project_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type text NOT NULL,
  name text NOT NULL,
  normalized_name text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_confirmed boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_entities_project_type ON project_entities(project_id, type);
CREATE INDEX idx_project_entities_normalized ON project_entities(project_id, normalized_name);

CREATE TABLE urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  normalized_url text NOT NULL,
  url_hash text NOT NULL,
  page_type text,
  importance numeric(5,2),
  status record_status NOT NULL DEFAULT 'active',
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, url_hash)
);

CREATE INDEX idx_urls_project_status ON urls(project_id, status);

CREATE TABLE analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url_id uuid REFERENCES urls(id) ON DELETE SET NULL,
  type analysis_type NOT NULL,
  source analysis_source NOT NULL,
  status run_status NOT NULL DEFAULT 'queued',
  requested_modules text[] NOT NULL DEFAULT '{}',
  completed_modules text[] NOT NULL DEFAULT '{}',
  ruleset_versions jsonb NOT NULL DEFAULT '{}'::jsonb,
  progress smallint NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  coverage numeric(5,2),
  confidence numeric(5,2),
  created_by uuid REFERENCES users(id),
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  error_summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX idx_analysis_runs_project_created ON analysis_runs(project_id, created_at DESC);
CREATE INDEX idx_analysis_runs_org_status ON analysis_runs(organization_id, status);
CREATE INDEX idx_analysis_runs_correlation ON analysis_runs(correlation_id);

CREATE TABLE analysis_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  analysis_run_id uuid NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  module_version text NOT NULL,
  status run_status NOT NULL DEFAULT 'queued',
  coverage numeric(5,2),
  attempts integer NOT NULL DEFAULT 0,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  UNIQUE (analysis_run_id, module_key)
);

CREATE TABLE artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  analysis_run_id uuid REFERENCES analysis_runs(id) ON DELETE CASCADE,
  type text NOT NULL,
  storage_key text NOT NULL UNIQUE,
  content_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  checksum text NOT NULL,
  encryption_state text NOT NULL DEFAULT 'provider_managed',
  retention_class text NOT NULL DEFAULT 'standard_90d',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE page_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  analysis_run_id uuid NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  url_id uuid REFERENCES urls(id) ON DELETE SET NULL,
  capture_source text NOT NULL,
  final_url text NOT NULL,
  http_status integer,
  content_type text,
  source_hash text,
  rendered_hash text,
  facts jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_artifact_id uuid REFERENCES artifacts(id) ON DELETE SET NULL,
  rendered_artifact_id uuid REFERENCES artifacts(id) ON DELETE SET NULL,
  screenshot_artifact_id uuid REFERENCES artifacts(id) ON DELETE SET NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX idx_page_snapshots_run ON page_snapshots(analysis_run_id);

CREATE TABLE findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  analysis_run_id uuid NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  url_id uuid REFERENCES urls(id) ON DELETE SET NULL,
  rule_key text NOT NULL,
  rule_version text NOT NULL,
  score_type score_type NOT NULL,
  category_key text NOT NULL,
  status finding_status NOT NULL,
  severity severity_level NOT NULL,
  title text NOT NULL,
  explanation text,
  impact_text text,
  remediation_text text,
  acceptance_criteria text,
  quality_ratio numeric(6,5) CHECK (quality_ratio BETWEEN 0 AND 1),
  points_available numeric(8,3) NOT NULL DEFAULT 0,
  points_earned numeric(8,3) NOT NULL DEFAULT 0,
  confidence numeric(6,5) CHECK (confidence BETWEEN 0 AND 1),
  effort smallint CHECK (effort BETWEEN 1 AND 5),
  priority action_priority,
  cause_group text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_findings_run_severity ON findings(analysis_run_id, severity, status);
CREATE INDEX idx_findings_project_rule ON findings(project_id, rule_key, created_at DESC);

CREATE TABLE evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  finding_id uuid NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  type text NOT NULL,
  source text,
  selector text,
  excerpt text,
  attribute_name text,
  attribute_value text,
  artifact_id uuid REFERENCES artifacts(id) ON DELETE SET NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_evidences_finding ON evidences(finding_id);

CREATE TABLE scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  analysis_run_id uuid NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  score_type score_type NOT NULL,
  ruleset_version text NOT NULL,
  score numeric(6,3) NOT NULL CHECK (score BETWEEN 0 AND 100),
  coverage numeric(6,3) NOT NULL CHECK (coverage BETWEEN 0 AND 100),
  confidence numeric(6,3) NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  categories jsonb NOT NULL DEFAULT '{}'::jsonb,
  gates jsonb NOT NULL DEFAULT '[]'::jsonb,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (analysis_run_id, score_type)
);

CREATE TABLE action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_analysis_run_id uuid REFERENCES analysis_runs(id) ON DELETE SET NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by uuid REFERENCES users(id),
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action_plan_id uuid NOT NULL REFERENCES action_plans(id) ON DELETE CASCADE,
  finding_id uuid REFERENCES findings(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  discipline text NOT NULL,
  priority action_priority NOT NULL,
  impact smallint CHECK (impact BETWEEN 1 AND 5),
  effort smallint CHECK (effort BETWEEN 1 AND 5),
  urgency smallint CHECK (urgency BETWEEN 1 AND 5),
  confidence numeric(6,5) CHECK (confidence BETWEEN 0 AND 1),
  estimated_score_gain numeric(8,3),
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  due_date date,
  status action_status NOT NULL DEFAULT 'open',
  acceptance_criteria text,
  source_type text NOT NULL DEFAULT 'finding',
  manual_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_action_items_plan_status ON action_items(action_plan_id, status, priority);

CREATE TABLE rulesets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  version text NOT NULL,
  score_type score_type NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  effective_at timestamptz,
  definition jsonb NOT NULL,
  changelog text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, version)
);

CREATE TABLE integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  encrypted_credentials bytea,
  scopes text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  connected_by uuid REFERENCES users(id),
  connected_at timestamptz,
  expires_at timestamptz,
  last_sync_at timestamptz,
  error_state jsonb
);

CREATE TABLE integration_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  external_resource_id text NOT NULL,
  external_resource_name text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  status record_status NOT NULL DEFAULT 'active',
  UNIQUE (integration_id, project_id, external_resource_id)
);

CREATE TABLE visibility_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  text text NOT NULL,
  language text NOT NULL,
  intent text NOT NULL,
  topic text,
  region text,
  priority smallint NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  source text NOT NULL DEFAULT 'manual',
  version integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE visibility_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES visibility_prompts(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model text NOT NULL,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  status run_status NOT NULL DEFAULT 'queued',
  executed_at timestamptz,
  latency_ms integer,
  cost_amount numeric(14,6),
  cost_currency char(3),
  answer_artifact_id uuid REFERENCES artifacts(id) ON DELETE SET NULL,
  normalized_response jsonb,
  confidence numeric(6,5),
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_visibility_runs_prompt_provider_date ON visibility_runs(prompt_id, provider, executed_at DESC);

CREATE TABLE visibility_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  visibility_run_id uuid NOT NULL REFERENCES visibility_runs(id) ON DELETE CASCADE,
  entity_id uuid REFERENCES project_entities(id) ON DELETE SET NULL,
  mention_type text NOT NULL,
  matched_text text,
  start_position integer,
  prominence numeric(6,5),
  sentiment_context text,
  accuracy_status text,
  confidence numeric(6,5),
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE visibility_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  visibility_run_id uuid NOT NULL REFERENCES visibility_runs(id) ON DELETE CASCADE,
  domain text NOT NULL,
  url text,
  title text,
  source_order integer,
  is_project_domain boolean NOT NULL DEFAULT false,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  analysis_run_id uuid REFERENCES analysis_runs(id) ON DELETE SET NULL,
  type text NOT NULL,
  status run_status NOT NULL DEFAULT 'queued',
  artifact_id uuid REFERENCES artifacts(id) ON DELETE SET NULL,
  requested_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_hash text,
  user_agent_summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_org_date ON audit_logs(organization_id, occurred_at DESC);

CREATE TABLE usage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  metric_key text NOT NULL,
  quantity numeric(16,6) NOT NULL,
  unit text NOT NULL,
  provider text,
  cost_amount numeric(14,6),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key text NOT NULL UNIQUE
);

CREATE INDEX idx_usage_records_org_date ON usage_records(organization_id, occurred_at);

-- Exemplo de função para updated_at; aplicar por trigger nas tabelas mutáveis.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_action_items_updated_at BEFORE UPDATE ON action_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS deve ser implementada nas migrações de produção após definição
-- do mecanismo de contexto da sessão, por exemplo app.current_organization_id.
