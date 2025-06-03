CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "username" TEXT NOT NULL UNIQUE,
    "hashed_password" BLOB NOT NULL,
    "salt" BLOB NOT NULL,
    "is_follower" INTEGER DEFAULT 0 NOT NULL
);
**
CREATE TABLE IF NOT EXISTS "roles" (
   "id" INTEGER PRIMARY KEY NOT NULL,
   "role" integer NOT NULL UNIQUE,
   "description" TEXT
);
**
CREATE TABLE IF NOT EXISTS "user_roles" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    PRIMARY KEY ("user_id", "role_id")
);
**
CREATE TABLE IF NOT EXISTS "permissions" (
     "id" INTEGER PRIMARY KEY NOT NULL,
     "name" TEXT NOT NULL UNIQUE,
     "description" TEXT
);
**
CREATE TABLE IF NOT EXISTS "role_permissions" (
      "role_id" INTEGER NOT NULL,
      "permission_id" INTEGER NOT NULL,
      PRIMARY KEY ("role_id", "permission_id")
);
**
CREATE TABLE IF NOT EXISTS "locations" (
       "id" INTEGER PRIMARY KEY NOT NULL,
       "name" TEXT NOT NULL UNIQUE,
       "longitude" integer,
       "latitude" integer,
       "radius" integer,
       "description" TEXT
);
**
CREATE TABLE IF NOT EXISTS "user_location" (
       "location_id" INTEGER NOT NULL,
       "user_id" INTEGER NOT NULL,
       PRIMARY KEY ("location_id", "user_id")
);
**
CREATE TABLE IF NOT EXISTS "clock_face" (
        "id" INTEGER PRIMARY KEY NOT NULL,
        "position" integer NOT NULL UNIQUE,
        "location_id" integer UNIQUE
);
**
CREATE TABLE IF NOT EXISTS "app_settings" (
      "id" INTEGER PRIMARY KEY NOT NULL,
      "name" integer NOT NULL UNIQUE,
      "value" TEXT NOT NULL
);
**
CREATE TABLE IF NOT EXISTS "follower_link" (
       "id" INTEGER PRIMARY KEY NOT NULL,
       "follower_id" integer NOT NULL UNIQUE,
       "lead_id" integer NOT NULL
);
**
PRAGMA foreign_keys = ON;
**
ALTER TABLE "users" ADD CONSTRAINT "fk_users_id" FOREIGN KEY("id") REFERENCES "user_roles"("user_id");
**
ALTER TABLE "roles" ADD CONSTRAINT "fk_roles_id" FOREIGN KEY("id") REFERENCES "user_roles"("role_id");
**
ALTER TABLE "role_permissions" ADD CONSTRAINT "fk_role_permissions_permission_id" FOREIGN KEY("permission_id") REFERENCES "permissions"("id");
**
ALTER TABLE "users" ADD CONSTRAINT "fk_users_id" FOREIGN KEY("id") REFERENCES "user_location"("user_id");
**
ALTER TABLE "locations" ADD CONSTRAINT "fk_locations_id" FOREIGN KEY("id") REFERENCES "user_location"("location_id");
**
ALTER TABLE "clock_face" ADD CONSTRAINT "fk_clock_face_location_id" FOREIGN KEY("location_id") REFERENCES "locations"("id");
**
ALTER TABLE "users" ADD CONSTRAINT "fk_users_id" FOREIGN KEY("id") REFERENCES "follower_link"("follower_id");
**
ALTER TABLE "users" ADD CONSTRAINT "fk_users_id" FOREIGN KEY("id") REFERENCES "follower_link"("lead_id");
**
ALTER TABLE "roles" ADD CONSTRAINT "fk_roles_id" FOREIGN KEY("id") REFERENCES "role_permissions"("role_id");
**
**
