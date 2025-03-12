import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { AuthContext } from './AuthContext'

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const response = await axios.get('/api/users/profile')
        setUser(response.data)
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/users/login', { email, password })
      const { token, user } = response.data
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      return user
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
      throw err
    }
  }

  const register = async (userData) => {
    try {
      console.log('Sending registration data:', userData);
      const response = await axios.post('/api/users/register', userData)
      const { token, user } = response.data
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      return user
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    setError(null)
  }

  const updateUser = (userData) => {
    setUser(userData)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
} 