CREATE TABLE public.albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_year_id UUID REFERENCES public.festival_years(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TYPE gallery_item_type AS ENUM ('photo', 'video');

CREATE TABLE public.gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id UUID REFERENCES public.albums(id) NOT NULL,
    festival_year_id UUID REFERENCES public.festival_years(id) NOT NULL,
    type gallery_item_type NOT NULL,
    file_url TEXT NOT NULL,
    caption TEXT,
    uploaded_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TYPE document_category AS ENUM ('bill', 'invoice', 'receipt', 'permission_letter', 'certificate', 'poster', 'other');

CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_year_id UUID REFERENCES public.festival_years(id) NOT NULL,
    category document_category NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON public.albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;
