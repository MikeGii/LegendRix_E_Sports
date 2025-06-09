export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  status: 'pending_email' | 'pending_approval' | 'approved' | 'rejected'
  emailVerified: boolean
  adminApproved: boolean
  createdAt: string
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<LoginResponse>
  register: (email: string, password: string, name: string) => Promise<RegisterResponse>
  logout: () => void
  refreshUser: () => Promise<void>
}