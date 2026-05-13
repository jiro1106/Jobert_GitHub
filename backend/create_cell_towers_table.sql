-- Create cell_towers table for storing OpenCellID data
CREATE TABLE IF NOT EXISTS public.cell_towers (
    id BIGSERIAL PRIMARY KEY,
    radio VARCHAR(10) NOT NULL,
    mcc INTEGER NOT NULL,
    mnc INTEGER NOT NULL,
    lac INTEGER NOT NULL,
    cid INTEGER NOT NULL,
    range INTEGER DEFAULT 0,
    longitude DECIMAL(10, 6) NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    samples INTEGER DEFAULT 0,
    accuracy INTEGER DEFAULT 0,
    changeable BOOLEAN DEFAULT true,
    created BIGINT,
    updated BIGINT,
    avg_signal INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mcc, mnc, lac, cid),
    CONSTRAINT valid_coordinates CHECK (
        latitude >= -90 AND latitude <= 90 AND
        longitude >= -180 AND longitude <= 180
    )
);

-- Create indexes for faster queries
CREATE INDEX idx_cell_towers_coordinates ON public.cell_towers(latitude, longitude);
CREATE INDEX idx_cell_towers_mcc_mnc ON public.cell_towers(mcc, mnc);
CREATE INDEX idx_cell_towers_location ON public.cell_towers(lac, cid);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE public.cell_towers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (optional)
CREATE POLICY "Allow public read access" ON public.cell_towers
    FOR SELECT USING (true);
