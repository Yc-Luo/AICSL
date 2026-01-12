/**
 * Authentication Store Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the external services
vi.mock('@/services/api/auth', () => ({
    authService: {
        login: vi.fn(),
        logout: vi.fn(),
        getCurrentUser: vi.fn(),
    }
}))

vi.mock('@/services/api/user', () => ({
    userService: {
        updateCurrentUser: vi.fn(),
    }
}))

vi.mock('@/services/sync/SyncService', () => ({
    syncService: {
        setToken: vi.fn(),
        reset: vi.fn(),
    }
}))

describe('Auth Store', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear()
        vi.clearAllMocks()
    })

    describe('Initial State', () => {
        it('should have correct initial state', async () => {
            const { useAuthStore } = await import('@/stores/authStore')
            const state = useAuthStore.getState()

            expect(state.user).toBeNull()
            expect(state.tokens).toBeNull()
            expect(state.isAuthenticated).toBe(false)
            expect(state.isLoading).toBe(false)
        })
    })

    describe('setTokens', () => {
        it('should set tokens correctly', async () => {
            const { useAuthStore } = await import('@/stores/authStore')

            const mockTokens = {
                access_token: 'test-access-token',
                refresh_token: 'test-refresh-token',
            }

            useAuthStore.getState().setTokens(mockTokens)

            const state = useAuthStore.getState()
            expect(state.tokens).toEqual(mockTokens)
        })
    })
})

describe('Auth Utilities', () => {
    it('should validate email format', () => {
        const validEmails = [
            'test@example.com',
            'user.name@domain.org',
            'user+tag@example.co.uk',
        ]

        const invalidEmails = [
            'invalid',
            '@nodomain.com',
            'no@',
            '',
        ]

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        validEmails.forEach(email => {
            expect(emailRegex.test(email)).toBe(true)
        })

        invalidEmails.forEach(email => {
            expect(emailRegex.test(email)).toBe(false)
        })
    })

    it('should validate password strength', () => {
        const strongPasswords = [
            'MyPassword123!',
            'SecureP@ss1',
        ]

        const weakPasswords = [
            '123456',
            'password',
            'abc',
        ]

        // Minimum 8 characters with number and letter
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

        strongPasswords.forEach(password => {
            expect(passwordRegex.test(password)).toBe(true)
        })

        weakPasswords.forEach(password => {
            expect(passwordRegex.test(password)).toBe(false)
        })
    })
})
