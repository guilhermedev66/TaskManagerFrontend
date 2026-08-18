export interface RegisterRequest {
  username: string
  password: string
}

export interface RegisterResponse {
  message: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface LogoutRequest {
  refreshToken: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
}
