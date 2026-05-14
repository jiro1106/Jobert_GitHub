# Signal PH Backend

FastAPI-based backend for Signal PH - Crowdsourced cellular signal monitoring platform.

## Project Structure

```
backend/
├── agents/              # LangChain/LangGraph agents for AI processing
├── config/              # Configuration management
│   └── settings.py     # Application settings from .env
├── controllers/         # Business logic controllers
├── middleware/          # Request/response middleware
├── models/              # Pydantic data models/schemas
├── routes/              # API endpoint routes
├── services/            # Service layer (external APIs)
├── utils/               # Helper utilities
├── towers_csv/          # OpenCellID data (not in git)
├── venv/                # Python virtual environment
├── main.py              # FastAPI application entry point
├── .env                 # Environment variables (not in git)
├── env.example          # Environment variables template
├── requirements.txt     # Python dependencies
└── seed_towers_rest_api.py  # Script to seed cell tower data
```

## Prerequisites

- **Python 3.13+** (installed from Microsoft Store or python.org)
- **pip** (comes with Python)

## Setup Instructions

### 1. Create and Activate Virtual Environment

```powershell
cd backend

python -m venv venv

.\venv\Scripts\Activate.ps1
```

### 2. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```powershell
# Copy the example to create your .env file
cp env.example .env
```

Then edit `.env` and add your actual credentials:
- **Google Maps**: API key
- **OpenCellID**: API key
- **Supabase**: URL and secret key (for cell tower data)

### 4. Start the Backend Server

```powershell
python main.py

python -m backend.main
```

The server will start at: **http://localhost:8000**

### 5. Access API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Health Check
```
GET /
GET /health
```

Returns: `{"status": "healthy"}`

## Database

### Cell Towers Data

The cell tower data from OpenCellID is stored in Supabase PostgreSQL (`cell_towers` table).

**To seed/reseed the data:**

```powershell
python seed_towers_rest_api.py
```

This will import ~37,864 cell tower records from `towers_csv/515.csv` into Supabase.

**Schema:**
- `id` - Primary key
- `radio` - Network type (GSM, LTE, UMTS, 5G, etc.)
- `mcc` - Mobile Country Code
- `mnc` - Mobile Network Code
- `lac` - Location Area Code
- `cid` - Cell ID
- `latitude`, `longitude` - Geographic coordinates
- `range` - Signal range in meters
- `samples` - Number of samples collected
- `accuracy` - Accuracy radius
- `created`, `updated` - Timestamps

## Development

### Project Stack

| Layer | Technology |
|-------|------------|
| Framework | FastAPI 0.136.1 |
| Server | Uvicorn 0.46.0 |
| Database | Supabase PostgreSQL |
| Auth | TBD (JWT-based) |
| AI/ML | LangChain 1.3.0 + LangGraph 1.2.0 |
| Maps | Google Maps Platform |
| APIs | Axios (via Python requests) |

### Key Dependencies

- **fastapi** - Web framework
- **uvicorn** - ASGI server
- **langchain** - AI framework
- **langgraph** - Agent orchestration
- **pydantic** - Data validation
- **supabase** - Supabase Python client
- **requests** - HTTP client
- **googlemaps** - Google Maps API
- **python-dotenv** - Environment variable management

### Running Tests

```powershell
# Test API keys
python test_api_keys.py

# Start development server with auto-reload
# (modify main.py to use reload=True in uvicorn.run())
```

## Troubleshooting

### Virtual Environment Issues
```powershell
# If activation fails, try:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run commands directly:
python -m pip install --upgrade pip
```

### Dependencies Installation Issues

For Windows-specific issues with packages requiring compilation:

```powershell
# Upgrade pip first
python -m pip install --upgrade pip

# Then reinstall requirements
pip install -r requirements.txt --force-reinstall
```

### Supabase Connection Issues

If REST API fails but direct connection works:
```powershell
# Use alternative seed method via SQL editor
# See create_cell_towers_table.sql for schema
```

## Environment Variables

See `env.example` for all available options. Key variables:

```env
# FastAPI
APP_ENV=development
DEBUG=True
HOST=0.0.0.0
PORT=8000

# Supabase (Cell Tower Data & Database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_secret_key
SUPABASE_HOST=postgres.your-project.pooler.supabase.com
SUPABASE_PORT=5432
SUPABASE_DATABASE=postgres
SUPABASE_USER=postgres
SUPABASE_PASSWORD=your_password

# External APIs
GOOGLE_MAPS_API_KEY=your_maps_key
OPENCELLID_API_KEY=your_opencellid_key
```

## Deployment

For production deployment to Render:

1. Push code to GitHub
2. Create Render Web Service from GitHub repo
3. Set environment variables in Render dashboard
4. Deploy!

The app will run on Render's free tier with these specs:
- Runtime: Python
- Start Command: `uvicorn main:app --host 0.0.0.0`

## Next Steps

1. ✅ Backend framework ready
2. ✅ Cell tower data seeded
3. ⏳ Implement API routes for signal data
4. ⏳ Setup authentication (JWT-based)
5. ⏳ Create LangChain agents for AI processing
6. ⏳ Add authentication middleware
7. ⏳ Deploy to Render

## Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [LangChain Docs](https://python.langchain.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Google Maps API](https://developers.google.com/maps)

## Support

For issues or questions, check:
1. `.env` configuration
2. Supabase connection status
3. API key validity
4. Network connectivity to external services
