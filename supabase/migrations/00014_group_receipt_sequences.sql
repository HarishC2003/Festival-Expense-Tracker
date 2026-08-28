-- Create new sequence table based on group_id instead of festival_year_id
CREATE TABLE public.group_receipt_sequences (
    group_id UUID REFERENCES public.groups(id) NOT NULL,
    prefix TEXT NOT NULL,
    current_value INTEGER DEFAULT 0,
    PRIMARY KEY (group_id, prefix)
);

-- Override the old function to use group_id and 5-digit padding
CREATE OR REPLACE FUNCTION generate_receipt_number(p_prefix TEXT, p_group_id UUID, p_group_code TEXT)
RETURNS TEXT AS $$
DECLARE
    next_val INTEGER;
    padded_val TEXT;
BEGIN
    INSERT INTO public.group_receipt_sequences (group_id, prefix, current_value)
    VALUES (p_group_id, p_prefix, 1)
    ON CONFLICT (group_id, prefix)
    DO UPDATE SET current_value = public.group_receipt_sequences.current_value + 1
    RETURNING current_value INTO next_val;

    padded_val := LPAD(next_val::text, 5, '0');
    RETURN p_prefix || '-' || p_group_code || '-' || padded_val;
END;
$$ LANGUAGE plpgsql VOLATILE;
