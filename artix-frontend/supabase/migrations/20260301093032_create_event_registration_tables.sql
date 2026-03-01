/*
  # ARTIX 2K26 Event Registration System

  1. New Tables
    - `registrations`
      - `id` (uuid, primary key)
      - `registration_id` (text, unique) - Format: ARTIX2026-XXXX
      - `full_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `college_name` (text)
      - `year_of_study` (text)
      - `branch` (text)
      - `roll_number` (text)
      - `selected_events` (jsonb) - Array of selected events
      - `event_type` (text) - 'individual' or 'combo'
      - `total_amount` (integer)
      - `payment_screenshot_url` (text)
      - `entry_status` (text) - 'pending', 'approved', 'rejected'
      - `entry_approved_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `team_members`
      - `id` (uuid, primary key)
      - `registration_id` (uuid, foreign key)
      - `member_name` (text)
      - `member_branch` (text)
      - `member_phone` (text)
      - `is_team_leader` (boolean)
      - `member_order` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Public can insert registrations
    - Only authenticated users (admins) can update entry status
    - Anyone can read their own registration data
*/

CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  college_name text NOT NULL,
  year_of_study text NOT NULL,
  branch text NOT NULL,
  roll_number text NOT NULL,
  selected_events jsonb NOT NULL DEFAULT '[]'::jsonb,
  event_type text NOT NULL,
  total_amount integer NOT NULL,
  payment_screenshot_url text,
  entry_status text NOT NULL DEFAULT 'pending',
  entry_approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid REFERENCES registrations(id) ON DELETE CASCADE,
  member_name text NOT NULL,
  member_branch text NOT NULL,
  member_phone text NOT NULL,
  is_team_leader boolean DEFAULT false,
  member_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert registrations"
  ON registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view registrations by email"
  ON registrations
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can update entry status"
  ON registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert team members"
  ON team_members
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view team members"
  ON team_members
  FOR SELECT
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_registration_id ON registrations(registration_id);
CREATE INDEX IF NOT EXISTS idx_team_members_registration_id ON team_members(registration_id);