// File: app/services/auth.ts

/**
 * loginUser(email, password)
 * ───────────────────────────
 * Sends a form-urlencoded POST to /users/login and returns { access_token, token_type }.
 *
 * Make sure to set NEXT_PUBLIC_API_BASE_URL (e.g. "https://…your-fastapi…") in your env.
 */
const API_ROOT = process.env.NEXT_PUBLIC_API_URL;

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  // (match your schemas.Token exactly)
}

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  // FastAPI’s OAuth2PasswordRequestForm expects:
  //   grant_type (defaults to “password”), username, password
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);
  // You can omit grant_type since FastAPI defaults to "password"
  // formData.append("grant_type", "password");

  const res = await fetch(`${API_ROOT}users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!res.ok) {
    // You might want to parse error details, but for simplicity:
    throw new Error(`Login failed (${res.status})`);
  }

  const data: LoginResponse = await res.json();
  return data;
}
