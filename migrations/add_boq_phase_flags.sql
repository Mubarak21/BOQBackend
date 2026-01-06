-- Add is_active and from_boq columns to phase table
ALTER TABLE phase 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS from_boq BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_phase_is_active ON phase(is_active);
CREATE INDEX IF NOT EXISTS idx_phase_from_boq ON phase(from_boq);

-- Update existing phases to be active (backward compatibility)
UPDATE phase SET is_active = true WHERE is_active IS NULL;
UPDATE phase SET from_boq = false WHERE from_boq IS NULL;
