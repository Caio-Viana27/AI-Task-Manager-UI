import { apiRequest } from './client.ts'

/** The logged-in user as the UI keeps it. v1 has no role-dependent UI, so roles are left out (D7). */
export interface AuthUser {
  id: string
  name: string
  email: string
}

/** Response of sign-up and sign-in (PLAN §3). `expiresAt` is an ISO-8601 instant. */
export interface AuthResponse {
  token: string
  expiresAt: string
  user: AuthUser
}

export interface SignUpRequest {
  email: string
  name: string
  password: string
}

export interface SignInRequest {
  email: string
  password: string
}

/** Response of `GET /users/me` (PLAN §3). */
interface UserResponse extends AuthUser {
  roles: string[]
}

export function signUp(request: SignUpRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/v1/auth/signup', { method: 'POST', body: request })
}

export function signIn(request: SignInRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/v1/auth/signin', { method: 'POST', body: request })
}

export async function getMe(signal?: AbortSignal): Promise<AuthUser> {
  const { id, name, email } = await apiRequest<UserResponse>('/v1/users/me', { signal })
  return { id, name, email }
}
