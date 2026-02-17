import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

describe('Smoke Test', () => {
    it('should render correctly', () => {
        render(<div>FGate Dashboard</div>)
        expect(screen.getByText('FGate Dashboard')).toBeInTheDocument()
    })
})
