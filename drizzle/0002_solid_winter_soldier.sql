CREATE TABLE "architect_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"category" text NOT NULL,
	"completion" integer DEFAULT 0 NOT NULL,
	"confidence" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'incomplete' NOT NULL,
	"questions_asked" integer DEFAULT 0 NOT NULL,
	"questions_answered" integer DEFAULT 0 NOT NULL,
	"subtopics_covered" text,
	"last_discussed_at" timestamp,
	"last_question" text,
	"missing_items" text,
	"key_points" text,
	"output_file" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "architect_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"turn_number" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"mode" text,
	"related_category" text,
	"tokens_used" integer,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "architect_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"decision" text NOT NULL,
	"rationale" text NOT NULL,
	"alternatives" text,
	"tradeoffs" text,
	"status" text DEFAULT 'proposed' NOT NULL,
	"impact" text,
	"superseded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "architect_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"status" text NOT NULL,
	"overall_completion" integer DEFAULT 0 NOT NULL,
	"readiness_score" integer DEFAULT 0 NOT NULL,
	"session_name" text,
	"last_topic" text,
	"total_turns" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"last_active_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "architect_categories" ADD CONSTRAINT "architect_categories_session_id_architect_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."architect_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architect_conversations" ADD CONSTRAINT "architect_conversations_session_id_architect_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."architect_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architect_decisions" ADD CONSTRAINT "architect_decisions_session_id_architect_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."architect_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architect_sessions" ADD CONSTRAINT "architect_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "architect_categories_session_id_idx" ON "architect_categories" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "architect_categories_category_idx" ON "architect_categories" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "architect_categories_session_category_unique" ON "architect_categories" USING btree ("session_id","category");--> statement-breakpoint
CREATE INDEX "architect_conversations_session_id_idx" ON "architect_conversations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "architect_conversations_turn_number_idx" ON "architect_conversations" USING btree ("session_id","turn_number");--> statement-breakpoint
CREATE INDEX "architect_conversations_created_at_idx" ON "architect_conversations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "architect_decisions_session_id_idx" ON "architect_decisions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "architect_decisions_category_idx" ON "architect_decisions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "architect_decisions_status_idx" ON "architect_decisions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "architect_sessions_project_id_idx" ON "architect_sessions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "architect_sessions_status_idx" ON "architect_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "architect_sessions_last_active_idx" ON "architect_sessions" USING btree ("last_active_at");