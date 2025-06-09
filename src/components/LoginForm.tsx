// src/components/LoginForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from './AuthProvider'

interface LoginFormData {
  email: string
  password: string
}

interface LoginFormProps {
  onSwitchToRegister: () => void
  onLoginStart: () => void
  onLoginError: () => void
}

export function LoginForm({ onSwitchToRegister, onLoginStart, onLoginError }: LoginFormProps) {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'warning' | 'info'>('error')
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setMessage('')
    setMessageType('error')
    onLoginStart() // Trigger the parent loading state
    
    console.log('🔐 LoginForm - Attempting login for:', data.email)
    
    try {
      const result = await login(data.email, data.password)
      
      console.log('🔐 LoginForm - Login result:', result)
      
      if (result.success && result.user) {
        console.log('✅ LoginForm - Login successful, maintaining loading state')
        // Keep loading state active - HomePage will handle the redirect
        // Don't call setIsLoading(false) here for successful login
      } else {
        console.log('❌ LoginForm - Login failed:', result.message)
        
        // Handle different types of login failures
        if (result.needsApproval) {
          setMessageType('warning')
          setMessage(result.message)
        } else {
          setMessageType('error')
          setMessage(result.message)
        }
        
        setIsLoading(false)
        onLoginError() // Reset parent loading state on error
      }
    } catch (error) {
      console.error('🔐 LoginForm - Unexpected error:', error)
      setMessage('An unexpected error occurred. Please try again.')
      setMessageType('error')
      setIsLoading(false)
      onLoginError()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <input
          type="email"
          placeholder="Email address"
          disabled={isLoading}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 focus:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {errors.email && (
          <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div>
        <input
          type="password"
          placeholder="Password"
          disabled={isLoading}
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters'
            }
          })}
          className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 focus:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {errors.password && (
          <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Authenticating...
          </div>
        ) : (
          'Sign In'
        )}
      </button>

      {/* Enhanced Error/Warning Messages */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          messageType === 'warning' 
            ? 'bg-yellow-950/80 border-yellow-800/50 animate-pulse' 
            : messageType === 'info'
            ? 'bg-blue-950/80 border-blue-800/50'
            : 'bg-red-950/80 border-red-800/50 animate-pulse'
        }`}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {messageType === 'warning' && <span className="text-yellow-400 text-lg">⚠️</span>}
              {messageType === 'info' && <span className="text-blue-400 text-lg">ℹ️</span>}
              {messageType === 'error' && <span className="text-red-400 text-lg">❌</span>}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                messageType === 'warning' ? 'text-yellow-200' : 
                messageType === 'info' ? 'text-blue-200' : 
                'text-red-200'
              }`}>
                {message}
              </p>
              {messageType === 'warning' && (
                <p className="text-xs text-yellow-300 mt-2">
                  💡 Your account will be activated once an administrator reviews and approves your registration.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Switch to Register */}
      <div className="text-center">
        <p className="text-gray-500 text-sm">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            disabled={isLoading}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Register here
          </button>
        </p>
      </div>
    </form>
  )
}