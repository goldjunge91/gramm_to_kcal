CREATE INDEX "products_user_created_idx" ON "products" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "products_user_active_idx" ON "products" USING btree ("user_id") WHERE "is_deleted" = false;--> statement-breakpoint
CREATE INDEX "products_user_sync_idx" ON "products" USING btree ("user_id","sync_status");--> statement-breakpoint
CREATE INDEX "products_name_search_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "ingredients_recipe_order_idx" ON "ingredients" USING btree ("recipe_id","order");--> statement-breakpoint
CREATE INDEX "ingredients_user_recipe_idx" ON "ingredients" USING btree ("user_id","recipe_id");--> statement-breakpoint
CREATE INDEX "recipes_user_created_idx" ON "recipes" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "recipes_user_active_idx" ON "recipes" USING btree ("user_id") WHERE "is_deleted" = false;--> statement-breakpoint
CREATE INDEX "recipes_name_search_idx" ON "recipes" USING btree ("name");