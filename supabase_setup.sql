
-- Create tables and setup the database

-- Users are handled by Supabase Auth

-- Create the accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  initial_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_account_type CHECK (type IN ('Demo', 'Live', 'Prop Firm', 'Other'))
);

-- Create the trades table
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  market VARCHAR(50) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  exit_price DECIMAL(20, 8) NOT NULL,
  stop_loss DECIMAL(20, 8),
  take_profit DECIMAL(20, 8),
  size DECIMAL(15, 2) NOT NULL,
  risk_reward VARCHAR(10),
  profit_loss DECIMAL(15, 2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  exit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_market CHECK (market IN ('Forex', 'Stocks', 'Crypto', 'Futures', 'Options', 'Other')),
  CONSTRAINT valid_type CHECK (type IN ('Long', 'Short')),
  CONSTRAINT valid_status CHECK (status IN ('Win', 'Loss', 'Breakeven'))
);

-- Create the journals table
CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS (Row Level Security) policies

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- Create policies for accounts table
CREATE POLICY "Users can view their own accounts"
ON accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
ON accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
ON accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
ON accounts FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for trades table
CREATE POLICY "Users can view their own trades"
ON trades FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
ON trades FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
ON trades FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades"
ON trades FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for journals table
CREATE POLICY "Users can view their own journal entries"
ON journals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries"
ON journals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
ON journals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
ON journals FOR DELETE
USING (auth.uid() = user_id);

-- Create test user (Run this in SQL Editor)
-- First create the user in Supabase Auth with:
-- Email: user@gmail.com
-- Password: user

-- Then create a default account for the test user
-- Replace 'USER_ID_HERE' with the actual UUID from the created user
INSERT INTO accounts (user_id, name, type, balance, initial_balance)
VALUES 
('USER_ID_HERE', 'Demo Account', 'Demo', 10000, 10000);
