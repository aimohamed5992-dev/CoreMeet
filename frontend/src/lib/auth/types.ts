export type User = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  avatarUrl: string | null;
};

export type AuthResponse = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  user: User;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: User;
};
