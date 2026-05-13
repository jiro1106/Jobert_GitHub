"""
Initialize Supabase tables for Signal-PH

Instructions:
1. Go to https://supabase.com and log in to your project
2. Navigate to SQL Editor
3. Copy the SQL statements below and run them
4. Tables will be created in the public schema

SQL Statements to run:
"""

SUPABASE_SQL_SETUP = """
-- Create crowdsourced_reports table
CREATE TABLE IF NOT EXISTS crowdsourced_reports (
    report_id BIGSERIAL PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    provider_name TEXT,
    signal_feedback TEXT,
    speed_feedback TEXT,
    issue_type TEXT,
    user_notes TEXT,
    source_type TEXT DEFAULT 'user_report',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_lat_lon ON crowdsourced_reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reports_provider ON crowdsourced_reports(provider_name);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON crowdsourced_reports(created_at DESC);

-- Create anomaly_logs table
CREATE TABLE IF NOT EXISTS anomaly_logs (
    anomaly_id BIGSERIAL PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    provider_name TEXT,
    predicted_score REAL,
    reported_feedback TEXT,
    anomaly_type TEXT,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for anomalies
CREATE INDEX IF NOT EXISTS idx_anomalies_lat_lon ON anomaly_logs(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_anomalies_provider ON anomaly_logs(provider_name);
CREATE INDEX IF NOT EXISTS idx_anomalies_created_at ON anomaly_logs(created_at DESC);

-- Grant public access (for development - restrict in production)
GRANT ALL ON crowdsourced_reports TO anon, authenticated;
GRANT ALL ON anomaly_logs TO anon, authenticated;
"""

def print_setup_instructions():
    """Print instructions for manual setup"""
    print("""
╔════════════════════════════════════════════════════════════════════════════╗
║                  SUPABASE TABLE SETUP INSTRUCTIONS                         ║
╚════════════════════════════════════════════════════════════════════════════╝

To set up the required tables in your Supabase project:

1. Log in to Supabase Dashboard:
   https://supabase.com

2. Select your project: "signal-ph" (or your project name)

3. Navigate to: SQL Editor (left sidebar)

4. Click "New Query"

5. Copy ALL of the SQL below and paste it into the editor:

""")
    print("=" * 80)
    print(SUPABASE_SQL_SETUP)
    print("=" * 80)
    
    print("\n6. Click \"Run\" button to execute all SQL statements\n")
    
    print("""7. After setup, verify tables were created:
   - Go to Table Editor (left sidebar)
   - You should see: cell_towers, crowdsourced_reports, anomaly_logs

8. Return to terminal and run tests again:
   python test_mcp_server.py

═══════════════════════════════════════════════════════════════════════════════
""")


if __name__ == "__main__":
    print_setup_instructions()

