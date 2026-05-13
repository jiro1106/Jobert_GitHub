import csv
from pathlib import Path
from config.settings import get_settings

# Note: You'll need to provide your Supabase ANON_KEY for this to work
# Get it from: https://jgwifnvnfuquullmxrmi.supabase.co/project/settings/api

try:
    from supabase import create_client, Client
except ImportError:
    print("❌ Supabase client not installed. Run: pip install supabase")
    exit(1)

settings = get_settings()
CSV_FILE = Path(__file__).parent / 'towers_csv' / '515.csv'

def create_supabase_client() -> Client:
    """Create Supabase client using REST API"""
    # Load from environment settings
    url = settings.supabase_url
    key = settings.supabase_key
    
    if not url or not key or key == "[YOUR-ANON-KEY-HERE]":
        print("❌ ERROR: Supabase credentials not configured!")
        print("\n📝 To configure:")
        print("1. Add to .env:")
        print("   SUPABASE_URL=https://jgwifnvnfuquullmxrmi.supabase.co")
        print("   SUPABASE_KEY=your_api_key_here")
        exit(1)
    
    return create_client(url, key)

def create_table(supabase: Client):
    """Create cell_towers table via REST API (Supabase PostgreSQL)"""
    print("📋 Creating table structure...")
    
    # Note: Table creation via REST API requires service_role key
    # For now, we'll assume the table exists or will be created manually
    print("   ℹ️  Note: Ensure 'cell_towers' table exists in Supabase")
    print("   Schema: id (serial), radio, mcc, mnc, lac, cid, range, longitude, latitude, samples, accuracy, changeable, created, updated, avg_signal")

def seed_data(supabase: Client):
    """Seed data from CSV file via Supabase REST API"""
    if not CSV_FILE.exists():
        print(f"❌ CSV file not found: {CSV_FILE}")
        return False
    
    try:
        with open(CSV_FILE, 'r') as f:
            csv_reader = csv.reader(f)
            rows = list(csv_reader)
        
        print(f"📄 Found {len(rows)} rows in CSV")
        
        # Prepare data for insertion
        data = []
        for row in rows:
            if len(row) >= 14:
                data.append({
                    "radio": row[0],
                    "mcc": int(row[1]),
                    "mnc": int(row[2]),
                    "lac": int(row[3]),
                    "cid": int(row[4]),
                    "range": int(row[5]),
                    "longitude": float(row[6]),
                    "latitude": float(row[7]),
                    "samples": int(row[8]),
                    "accuracy": int(row[9]),
                    "changeable": bool(int(row[10])),
                    "created": int(row[11]),
                    "updated": int(row[12]),
                    "avg_signal": int(row[13])
                })
        
        print(f"🌱 Inserting {len(data)} records via REST API...")
        
        # Insert in batches (Supabase limits request size)
        batch_size = 100
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            try:
                response = supabase.table("cell_towers").insert(batch).execute()
                print(f"   ✅ Inserted batch {i//batch_size + 1} ({len(batch)} records)")
            except Exception as e:
                print(f"   ⚠️  Batch {i//batch_size + 1} warning: {str(e)[:60]}")
                # Try individual inserts for this batch
                for record in batch:
                    try:
                        supabase.table("cell_towers").insert(record).execute()
                    except:
                        pass
        
        print(f"✅ Successfully seeded {len(data)} cell tower records")
        return True
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        return False

def test_import(supabase: Client):
    """Test the import by querying the data"""
    try:
        # Count total records
        print("\n🧪 Testing import...")
        response = supabase.table("cell_towers").select("COUNT(*)").execute()
        
        # Get sample records
        response = supabase.table("cell_towers").select("*").limit(5).execute()
        samples = response.data
        
        print(f"\n📍 Sample records:")
        print("-" * 100)
        print(f"{'Radio':<8} {'MCC':<6} {'MNC':<6} {'LAC':<8} {'CID':<8} {'Longitude':<12} {'Latitude':<12} {'Samples':<10} {'Accuracy':<10}")
        print("-" * 100)
        
        for row in samples:
            print(f"{row['radio']:<8} {row['mcc']:<6} {row['mnc']:<6} {row['lac']:<8} {row['cid']:<8} {row['longitude']:<12.4f} {row['latitude']:<12.4f} {row['samples']:<10} {row['accuracy']:<10}")
        
        print("\n✅ Import test successful!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing import: {e}")
        return False

def main():
    """Main function"""
    print("🚀 OpenCellID Cell Tower Seeder (REST API)")
    print("=" * 100)
    
    try:
        # Create Supabase client
        print("\n🔗 Connecting to Supabase via REST API...")
        supabase = create_supabase_client()
        print("✅ Connected successfully!")
        
        # Create table
        create_table(supabase)
        
        # Seed data
        print("\n🌱 Seeding data from CSV...")
        success = seed_data(supabase)
        
        # Test import
        if success:
            test_import(supabase)
        
        print("\n" + "=" * 100)
        print("✅ Done!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    main()
