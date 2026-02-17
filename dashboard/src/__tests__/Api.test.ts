import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiRequest } from '@/lib/api'

// Mock fetch
global.fetch = vi.fn()

describe('api.ts apiRequest', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
    })

    it('should make a request with correct headers', async () => {
        ; (fetch as any).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ data: 'success' }),
        })

        const result = await apiRequest('/test-endpoint')

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/test-endpoint'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json'
                })
            })
        )
        expect(result).toEqual({ data: 'success' })
    })

    it('should include auth token if present', async () => {
        localStorage.setItem('token', 'fake-token')
            ; (fetch as any).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            })

        await apiRequest('/test-endpoint')

        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer fake-token'
                })
            })
        )
    })

    it('should throw error on non-ok response', async () => {
        ; (fetch as any).mockResolvedValue({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ detail: 'Bad Request' }),
        })

        await expect(apiRequest('/bad')).rejects.toThrow('Bad Request')
    })
})
