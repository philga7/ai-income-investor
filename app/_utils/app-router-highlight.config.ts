import { NextRequest, NextResponse } from 'next/server'
import { H } from '@highlight-run/next/server'

export function withAppRouterHighlight(handler: Function) {
    return async function (request: NextRequest) {
        const { span } = H.startWithHeaders('app-router-span', {})
        try {
            const response = await handler(request)
            span.end()
            return response
        } catch (error) {
            span.end()
            throw error
        }
    }
} 