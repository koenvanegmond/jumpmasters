-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  fleet VARCHAR(20) DEFAULT 'Bronze',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  height_m DECIMAL(5,2) NOT NULL,
  airtime_s DECIMAL(5,2) NOT NULL,
  distance_m DECIMAL(6,2) NOT NULL,
  points DECIMAL(8,2) NOT NULL,
  screenshot_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_verified ON sessions(verified);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);

-- Fleets table
CREATE TABLE IF NOT EXISTS fleets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(20) UNIQUE NOT NULL,
  min_height DECIMAL(5,2) NOT NULL,
  color_hex VARCHAR(7) NOT NULL
);

INSERT INTO fleets (name, min_height, color_hex) VALUES
  ('Bronze', 0, '#CD7F32'),
  ('Silver', 5, '#C0C0C0'),
  ('Gold', 10, '#FFD700'),
  ('Platinum', 15, '#E5E4E2')
ON CONFLICT (name) DO NOTHING;
