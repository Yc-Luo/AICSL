/**
 * Test utilities and helpers
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

/**
 * Custom render function that includes common providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    route?: string
}

function AllTheProviders({ children }: { children: ReactNode }) {
    return (
        <BrowserRouter>
            {children}
        </BrowserRouter>
    )
}

export function renderWithProviders(
    ui: ReactElement,
    options?: CustomRenderOptions
) {
    const { route = '/', ...renderOptions } = options || {}

    window.history.pushState({}, 'Test page', route)

    return render(ui, {
        wrapper: AllTheProviders,
        ...renderOptions,
    })
}

/**
 * Wait for async operations to complete
 */
export function waitForAsync(ms: number = 0): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Create a mock function with typed return value
 */
export async function createMockFn<T>(returnValue?: T) {
    const { vi } = await import('vitest')
    return vi.fn().mockReturnValue(returnValue)
}

/**
 * Create mock API response
 */
export function createMockApiResponse<T>(data: T) {
    return {
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
    }
}

// Re-export everything from testing-library
export * from '@testing-library/react'

// Export the custom render as default render
export { renderWithProviders as render }
