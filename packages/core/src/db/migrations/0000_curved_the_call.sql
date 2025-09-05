CREATE TABLE IF NOT EXISTS "agent_instances" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"evolution_dna_id" uuid NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_task_id" uuid,
	"spawned_at" timestamp DEFAULT now(),
	"last_active_at" timestamp DEFAULT now(),
	"performance_history" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agents" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"prompt" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "approvals" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"project_id" uuid,
	"machine_id" text NOT NULL,
	"tmux_target" text,
	"command" text NOT NULL,
	"risk_level" text DEFAULT 'medium',
	"status" text DEFAULT 'pending' NOT NULL,
	"decision_reason" text,
	"created_at" timestamp DEFAULT now(),
	"decided_at" timestamp,
	"expires_at" timestamp DEFAULT now() + interval '1 hour'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"project_id" uuid,
	"agent_id" uuid,
	"task_id" uuid,
	"approval_id" uuid,
	"event_type" text NOT NULL,
	"event_data" jsonb DEFAULT '{}'::jsonb,
	"machine_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "evolution_dna" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"pattern_type" text NOT NULL,
	"genetics" jsonb NOT NULL,
	"performance_metrics" jsonb NOT NULL,
	"project_context" jsonb NOT NULL,
	"generation" integer DEFAULT 1,
	"parent_id" uuid,
	"embedding" "vector(1536)",
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "evolution_events" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"parent_dna_id" uuid NOT NULL,
	"child_dna_id" uuid NOT NULL,
	"agent_instance_id" uuid NOT NULL,
	"evolution_trigger" text NOT NULL,
	"genetic_changes" jsonb NOT NULL,
	"performance_delta" jsonb NOT NULL,
	"confidence_score" real NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_outcomes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"agent_instance_id" uuid NOT NULL,
	"evolution_dna_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"outcome_type" text NOT NULL,
	"performance_improvement" real NOT NULL,
	"lesson_learned" text NOT NULL,
	"context_factors" jsonb NOT NULL,
	"applicability_score" real NOT NULL,
	"embedding" "vector(1536)",
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memory_items" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"project_id" uuid,
	"task_id" uuid,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"embedding" "vector(1536)",
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_evolution_contexts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"project_id" uuid NOT NULL,
	"evolution_dna_id" uuid NOT NULL,
	"adaptation_score" real NOT NULL,
	"usage_count" integer DEFAULT 0,
	"average_performance" jsonb NOT NULL,
	"last_used_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"repo_url" text,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "projects_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subagents" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"agent_id" uuid,
	"task_id" uuid,
	"machine_id" text NOT NULL,
	"tmux_target" text NOT NULL,
	"status" text DEFAULT 'active',
	"context_summary" text,
	"created_at" timestamp DEFAULT now(),
	"last_seen" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"project_id" uuid,
	"title" text NOT NULL,
	"spec" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"assigned_agent" uuid,
	"parent_task_id" uuid,
	"priority" integer DEFAULT 1,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_instances" ADD CONSTRAINT "agent_instances_evolution_dna_id_evolution_dna_id_fk" FOREIGN KEY ("evolution_dna_id") REFERENCES "evolution_dna"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_instances" ADD CONSTRAINT "agent_instances_current_task_id_tasks_id_fk" FOREIGN KEY ("current_task_id") REFERENCES "tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approvals" ADD CONSTRAINT "approvals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_approval_id_approvals_id_fk" FOREIGN KEY ("approval_id") REFERENCES "approvals"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "evolution_dna" ADD CONSTRAINT "evolution_dna_parent_id_evolution_dna_id_fk" FOREIGN KEY ("parent_id") REFERENCES "evolution_dna"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "evolution_events" ADD CONSTRAINT "evolution_events_parent_dna_id_evolution_dna_id_fk" FOREIGN KEY ("parent_dna_id") REFERENCES "evolution_dna"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "evolution_events" ADD CONSTRAINT "evolution_events_child_dna_id_evolution_dna_id_fk" FOREIGN KEY ("child_dna_id") REFERENCES "evolution_dna"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "evolution_events" ADD CONSTRAINT "evolution_events_agent_instance_id_agent_instances_id_fk" FOREIGN KEY ("agent_instance_id") REFERENCES "agent_instances"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "learning_outcomes" ADD CONSTRAINT "learning_outcomes_agent_instance_id_agent_instances_id_fk" FOREIGN KEY ("agent_instance_id") REFERENCES "agent_instances"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "learning_outcomes" ADD CONSTRAINT "learning_outcomes_evolution_dna_id_evolution_dna_id_fk" FOREIGN KEY ("evolution_dna_id") REFERENCES "evolution_dna"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "learning_outcomes" ADD CONSTRAINT "learning_outcomes_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_items" ADD CONSTRAINT "memory_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_items" ADD CONSTRAINT "memory_items_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_evolution_contexts" ADD CONSTRAINT "project_evolution_contexts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_evolution_contexts" ADD CONSTRAINT "project_evolution_contexts_evolution_dna_id_evolution_dna_id_fk" FOREIGN KEY ("evolution_dna_id") REFERENCES "evolution_dna"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subagents" ADD CONSTRAINT "subagents_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subagents" ADD CONSTRAINT "subagents_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_agent_agents_id_fk" FOREIGN KEY ("assigned_agent") REFERENCES "agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_tasks_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
