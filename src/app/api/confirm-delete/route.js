import { NextResponse } from 'next/server';
import { confirmBusinessDeletion } from '@/actions/business';

export async function GET(request) {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.redirect(new URL('/vendor?error=missing_token', request.url));
    }

    const result = await confirmBusinessDeletion(token);

    if (result.success) {
        // Redirect to vendor page with success message
        return NextResponse.redirect(new URL('/vendor?deleted=true', request.url));
    } else {
        // Redirect with error
        return NextResponse.redirect(new URL(`/vendor?error=${encodeURIComponent(result.error || 'unknown')}`, request.url));
    }
}
