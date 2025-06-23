PRAGMA foreign_keys = ON;
**
CREATE TABLE IF NOT EXISTS "users" (
    'id' INTEGER PRIMARY KEY NOT NULL,
    'username' TEXT NOT NULL UNIQUE,
    'hashed_password' BLOB NOT NULL,
    'salt' BLOB NOT NULL,
    'follower' INTEGER DEFAULT 0 NOT NULL
);
**
CREATE TABLE IF NOT EXISTS "roles" (
    'id' INTEGER PRIMARY KEY NOT NULL,
    'role' TEXT NOT NULL UNIQUE,
    'description' TEXT
);
**
CREATE TABLE IF NOT EXISTS "locations" (
    'id' INTEGER PRIMARY KEY NOT NULL,
    'name' TEXT NOT NULL UNIQUE,
    'longitude' TEXT NOT NULL,
    'latitude' TEXT NOT NULL,
    'radius' integer NOT NULL,
    'description' TEXT,
    'isDefault' INTEGER DEFAULT 0 NOT NULL
);
**
CREATE TABLE IF NOT EXISTS "permissions" (
    'id' INTEGER PRIMARY KEY NOT NULL,
    'name' TEXT NOT NULL UNIQUE,
    'description' TEXT
);
**
CREATE TABLE IF NOT EXISTS "clock_face" (
    'id' INTEGER PRIMARY KEY NOT NULL,
    'face_position' integer NOT NULL UNIQUE,
    'name' text NOT NULL
);
**
CREATE TABLE IF NOT EXISTS "user_roles" (
    'user_id' INTEGER NOT NULL,
    'role_id' INTEGER NOT NULL,
    PRIMARY KEY ('user_id', 'role_id'),
    FOREIGN KEY ('user_id') REFERENCES users('id'),
    FOREIGN KEY ('role_id') REFERENCES roles('id')
);
**
CREATE TABLE IF NOT EXISTS "user_location" (
    'user_id' INTEGER NOT NULL UNIQUE,
    'location_id' INTEGER NOT NULL,
    PRIMARY KEY ('user_id', 'location_id'),
    FOREIGN KEY ('user_id') REFERENCES users('id'),
    FOREIGN KEY ('location_id') REFERENCES locations('id')
);
**
CREATE TABLE IF NOT EXISTS "position_locations" (
    'location_id' INTEGER NOT NULL UNIQUE ,
    'position_id' INTEGER NOT NULL,
    PRIMARY KEY ('location_id', 'position_id'),
    FOREIGN KEY ('location_id') REFERENCES locations('id'),
    FOREIGN KEY ('position_id') REFERENCES clock_face('id')
);
**
CREATE TABLE IF NOT EXISTS "role_permissions" (
      'role_id' INTEGER NOT NULL,
      'permission_id' INTEGER NOT NULL,
      PRIMARY KEY ('role_id', 'permission_id'),
      FOREIGN KEY ('role_id') REFERENCES roles('id'),
      FOREIGN KEY ('permission_id') REFERENCES permissions('id')
);
**
CREATE TABLE IF NOT EXISTS "app_settings" (
      'id' INTEGER PRIMARY KEY NOT NULL,
      'name' integer NOT NULL UNIQUE,
      'value' TEXT NOT NULL
);
**
CREATE TABLE IF NOT EXISTS "follower_link" (
       'id' INTEGER PRIMARY KEY NOT NULL,
       'follower_id' integer NOT NULL UNIQUE,
       'lead_id' integer NOT NULL,
       FOREIGN KEY ('follower_id') REFERENCES users('id'),
       FOREIGN KEY ('lead_id') REFERENCES users('id')
);
**
INSERT OR IGNORE INTO roles (id,role, description) VALUES
       (1,'admin', 'Is the administrator of the instance.'),
       (2,'user', 'Can have a child attached.'),
       (3,'child', 'Only can be attached or set.');
**
INSERT OR IGNORE INTO clock_face (id,face_position, name) VALUES
       (1,1, 'Position 1'),
       (2,2, 'Position 2'),
       (3,3, 'Position 3'),
       (4,4, 'Position 4'),
       (5,5, 'Position 5'),
       (6,6, 'Position 6'),
       (7,7, 'Position 7'),
       (8,8, 'Position 8'),
       (9,9, 'Position 9'),
       (10,10, 'Position 10'),
       (11,11, 'Position 11'),
       (12,12, 'Position 12'),
       (13, 13, 'Out And About');
**
INSERT OR IGNORE INTO locations (id, name, latitude, longitude, radius, description, isDefault) VALUES
    (1,'Default', '0', '0', 0, 'Default location', 1);
**
INSERT OR IGNORE INTO position_locations (location_id, position_id)  VALUES
    (1,13);
