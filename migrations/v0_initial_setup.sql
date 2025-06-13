PRAGMA foreign_keys = ON;
**
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
   "role" TEXT NOT NULL UNIQUE,
   "description" TEXT
);
**
CREATE TABLE IF NOT EXISTS "user_roles" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    PRIMARY KEY ("user_id", "role_id"),
    FOREIGN KEY ("user_id") REFERENCES users("id"),
    FOREIGN KEY ("role_id") REFERENCES roles("id")
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
      PRIMARY KEY ("role_id", "permission_id"),
      FOREIGN KEY ("role_id") REFERENCES roles("id"),
      FOREIGN KEY ("permission_id") REFERENCES permissions("id")
);
**
CREATE TABLE IF NOT EXISTS "locations" (
       "id" INTEGER PRIMARY KEY NOT NULL,
       "name" TEXT NOT NULL UNIQUE,
       "longitude" TEXT NOT NULL,
       "latitude" TEXT NOT NULL,
       "radius" integer NOT NULL,
       "description" TEXT
);
**
CREATE TABLE IF NOT EXISTS "user_location" (
       "user_id" INTEGER NOT NULL,
       "location_id" INTEGER NOT NULL,
       PRIMARY KEY ("user_id", "location_id"),
       FOREIGN KEY ("user_id") REFERENCES users("id"),
       FOREIGN KEY ("location_id") REFERENCES locations("id")
);
**
CREATE TABLE IF NOT EXISTS "clock_face" (
        "id" INTEGER PRIMARY KEY NOT NULL,
        "position" integer NOT NULL UNIQUE,
        "location_id" integer UNIQUE,
        FOREIGN KEY ("location_id") REFERENCES locations("id")
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
       "lead_id" integer NOT NULL,
       FOREIGN KEY ("follower_id") REFERENCES users("id"),
       FOREIGN KEY ("lead_id") REFERENCES users("id")
);
**
INSERT OR IGNORE INTO roles (id,role, description) VALUES
       (1,"admin", "Is the administrator of the instance."),
       (2,"user", "Can have a child attached."),
       (3,"child", "Only can be attached or set.");
**
INSERT OR IGNORE INTO clock_face (id,position) VALUES
       (1,1),
       (2,2),
       (3,3),
       (4,4),
       (5,5),
       (6,6),
       (7,7),
       (8,8),
       (9,9),
       (10,10),
       (11,11),
       (12,12),
       (13,13);
