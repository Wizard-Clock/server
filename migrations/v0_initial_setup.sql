CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "username" TEXT NOT NULL UNIQUE,
    "hashed_password" BLOB NOT NULL,
    "salt" BLOB NOT NULL,
    "is_follower" INTEGER DEFAULT 0 NOT NULL
);
**
INSERT OR IGNORE INTO users (username, hashed_password, salt) VALUES ("admin", "sfhslkfjsfs", "slkfjsdlkfjsldf");
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
