CREATE TYPE "public"."price_band" AS ENUM('$', '$$', '$$$', '$$$$');--> statement-breakpoint
CREATE TYPE "public"."todo_status" AS ENUM('todo', 'eaten');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "friends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"photo_url" varchar(500),
	"user_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "friends_email_unique" UNIQUE("email"),
	CONSTRAINT "friends_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(8) NOT NULL,
	"email" varchar(255),
	"created_by" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"claimed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"location" varchar(200) NOT NULL,
	"cuisine_tags" text[] DEFAULT '{}' NOT NULL,
	"photo_url" varchar(500),
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todo_eat_list" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"status" "todo_status" DEFAULT 'todo' NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"avatar_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "visit_companions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"friend_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"visited_at" timestamp DEFAULT now() NOT NULL,
	"rating" integer,
	"price_band" "price_band",
	"notes" text,
	"photo_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "friends" ADD CONSTRAINT "friends_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friends" ADD CONSTRAINT "friends_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_claimed_by_users_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_eat_list" ADD CONSTRAINT "todo_eat_list_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_eat_list" ADD CONSTRAINT "todo_eat_list_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_companions" ADD CONSTRAINT "visit_companions_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_companions" ADD CONSTRAINT "visit_companions_friend_id_friends_id_fk" FOREIGN KEY ("friend_id") REFERENCES "public"."friends"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "friends_user_id_idx" ON "friends" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "friends_created_by_idx" ON "friends" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "invites_code_idx" ON "invites" USING btree ("code");--> statement-breakpoint
CREATE INDEX "invites_expires_at_idx" ON "invites" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "restaurants_created_by_idx" ON "restaurants" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "todo_eat_list_user_restaurant_idx" ON "todo_eat_list" USING btree ("user_id","restaurant_id");--> statement-breakpoint
CREATE INDEX "todo_eat_list_user_status_idx" ON "todo_eat_list" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "todo_eat_list_restaurant_id_idx" ON "todo_eat_list" USING btree ("restaurant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "visit_companions_visit_friend_idx" ON "visit_companions" USING btree ("visit_id","friend_id");--> statement-breakpoint
CREATE INDEX "visit_companions_visit_id_idx" ON "visit_companions" USING btree ("visit_id");--> statement-breakpoint
CREATE INDEX "visit_companions_friend_id_idx" ON "visit_companions" USING btree ("friend_id");--> statement-breakpoint
CREATE INDEX "visits_user_id_visited_at_idx" ON "visits" USING btree ("user_id","visited_at");--> statement-breakpoint
CREATE INDEX "visits_restaurant_id_idx" ON "visits" USING btree ("restaurant_id");