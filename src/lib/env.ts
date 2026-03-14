const requiredEnvironmentVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const serviceEnvironmentVariables = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

type RequiredEnvironmentVariable = (typeof requiredEnvironmentVariables)[number];
type ServiceEnvironmentVariable = (typeof serviceEnvironmentVariables)[number];

function readEnvironmentVariable(name: RequiredEnvironmentVariable | ServiceEnvironmentVariable) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  supabaseUrl: () => readEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => readEnvironmentVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => readEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY"),
};
