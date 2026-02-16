-- Create table for Dynamic Affiliate Ranks
CREATE TABLE IF NOT EXISTS affiliate_ranks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    min_referrals INTEGER UNIQUE NOT NULL,
    bonus_percentage FLOAT DEFAULT 0.0,
    icon VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc')
);

-- Insert Default Ranks (Seed Data)
INSERT INTO affiliate_ranks (name, min_referrals, icon) VALUES 
('Bronce', 0, '🥉'),
('Plata', 3, '🥈'),
('Oro', 6, '🥇'),
('Diamante', 21, '💎')
ON CONFLICT (name) DO NOTHING;
