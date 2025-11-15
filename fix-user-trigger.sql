-- Fix the handle_new_user trigger to work with first_name and last_name columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Parse full_name from metadata if it exists, otherwise leave first/last name null
  DECLARE
    full_name_value TEXT;
    name_parts TEXT[];
  BEGIN
    full_name_value := NEW.raw_user_meta_data->>'full_name';

    IF full_name_value IS NOT NULL AND full_name_value != '' THEN
      -- Split full name into parts
      name_parts := string_to_array(trim(full_name_value), ' ');

      INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        avatar_url
      )
      VALUES (
        NEW.id,
        NEW.email,
        name_parts[1], -- First name
        CASE
          WHEN array_length(name_parts, 1) > 1
          THEN array_to_string(name_parts[2:array_length(name_parts, 1)], ' ')
          ELSE NULL
        END, -- Last name (everything after first name)
        NEW.raw_user_meta_data->>'avatar_url'
      );
    ELSE
      -- No full name provided, just create with email
      INSERT INTO public.users (
        id,
        email,
        avatar_url
      )
      VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
      );
    END IF;

    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
