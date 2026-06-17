import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * POST /api/ktv/push-unsubscribe
 * Xóa push subscription khỏi database khi user đăng xuất
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { staffId, endpoint } = body;

        if (!staffId || !endpoint) {
            return NextResponse.json(
                { success: false, error: 'staffId and endpoint are required' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: 'Supabase admin not initialized' },
                { status: 500 }
            );
        }

        // Xóa subscription có trùng endpoint và staffId
        const { error, count } = await supabase
            .from('StaffPushSubscriptions')
            .delete({ count: 'exact' })
            .eq('staff_id', staffId)
            .eq('subscription->>endpoint', endpoint);

        if (error) {
            console.error('❌ [Push Unsubscribe API] Error deleting subscription:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        console.log(`✅ [Push Unsubscribe API] Deleted ${count || 0} subscriptions for staff:`, staffId);
        return NextResponse.json({ success: true, count });
    } catch (error: any) {
        console.error('❌ [Push Unsubscribe API] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
