import os
from dotenv import load_dotenv

load_dotenv()

# Supabase Credentials
# Defaults are empty strings to prevent startup crashes if envs missing, but will fail at runtime.
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# Stripe Credentials
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
