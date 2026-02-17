import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import React from 'react'

describe('DashboardHeader', () => {
    it('should render the title and button', () => {
        const handleCreateChannel = vi.fn()
        render(
            <DashboardHeader
                handleCreateChannel={handleCreateChannel}
                managingPromos={false}
                setManagingPromos={() => { }}
            />
        )

        expect(screen.getByText(/Panel de/i)).toBeInTheDocument()
        expect(screen.getByText(/Control/i)).toBeInTheDocument()
        expect(screen.getByText(/Nuevo Canal VIP/i)).toBeInTheDocument()
    })

    it('should call handleCreateChannel when button is clicked', () => {
        const handleCreateChannel = vi.fn()
        render(
            <DashboardHeader
                handleCreateChannel={handleCreateChannel}
                managingPromos={false}
                setManagingPromos={() => { }}
            />
        )

        const button = screen.getByText(/Nuevo Canal VIP/i).closest('button')
        if (button) fireEvent.click(button)

        expect(handleCreateChannel).toHaveBeenCalledTimes(1)
    })
})
