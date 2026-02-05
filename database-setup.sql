-- Moxy Hotel Stair Landing Tracker - Database Setup
-- Run this in Supabase SQL Editor

-- Landings table
CREATE TABLE landings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number INTEGER NOT NULL,
  label TEXT DEFAULT '',
  pos_x REAL DEFAULT 0,
  pos_y REAL DEFAULT 0,
  shore_complete BOOLEAN DEFAULT false,
  shore_date TEXT,
  shore_by TEXT,
  steel_complete BOOLEAN DEFAULT false,
  steel_date TEXT,
  steel_by TEXT,
  pour_complete BOOLEAN DEFAULT false,
  pour_date TEXT,
  pour_by TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activity log table
CREATE TABLE activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  company TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  device_info TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Settings table (for background image etc)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE landings;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;

-- Row Level Security - allow all operations with anon key
ALTER TABLE landings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on landings" ON landings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on activity_log" ON activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Seed 44 landings - positioned bottom to top on the stairwell
-- 3 per level group, starting from basement going up
INSERT INTO landings (number, label, pos_x, pos_y) VALUES
  (1,  'Landing 1',  560, 920),
  (2,  'Landing 2',  510, 900),
  (3,  'Landing 3',  460, 880),
  (4,  'Landing 4',  560, 855),
  (5,  'Landing 5',  510, 835),
  (6,  'Landing 6',  460, 815),
  (7,  'Landing 7',  560, 790),
  (8,  'Landing 8',  510, 770),
  (9,  'Landing 9',  460, 750),
  (10, 'Landing 10', 560, 725),
  (11, 'Landing 11', 510, 705),
  (12, 'Landing 12', 460, 685),
  (13, 'Landing 13', 560, 660),
  (14, 'Landing 14', 510, 640),
  (15, 'Landing 15', 460, 620),
  (16, 'Landing 16', 560, 595),
  (17, 'Landing 17', 510, 575),
  (18, 'Landing 18', 460, 555),
  (19, 'Landing 19', 560, 530),
  (20, 'Landing 20', 510, 510),
  (21, 'Landing 21', 460, 490),
  (22, 'Landing 22', 560, 465),
  (23, 'Landing 23', 510, 445),
  (24, 'Landing 24', 460, 425),
  (25, 'Landing 25', 560, 400),
  (26, 'Landing 26', 510, 380),
  (27, 'Landing 27', 460, 360),
  (28, 'Landing 28', 560, 335),
  (29, 'Landing 29', 510, 315),
  (30, 'Landing 30', 460, 295),
  (31, 'Landing 31', 560, 270),
  (32, 'Landing 32', 510, 250),
  (33, 'Landing 33', 460, 230),
  (34, 'Landing 34', 560, 205),
  (35, 'Landing 35', 510, 185),
  (36, 'Landing 36', 460, 165),
  (37, 'Landing 37', 560, 140),
  (38, 'Landing 38', 510, 120),
  (39, 'Landing 39', 460, 100),
  (40, 'Landing 40', 560, 75),
  (41, 'Landing 41', 510, 55),
  (42, 'Landing 42', 460, 35),
  (43, 'Landing 43', 560, 10),
  (44, 'Landing 44', 510, -10);
