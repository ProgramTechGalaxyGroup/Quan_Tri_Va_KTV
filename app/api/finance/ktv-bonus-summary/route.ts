import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Fetch Staff (only active ones)
        const { data: staffList, error: staffError } = await supabase
            .from('Staff')
            .select('id, full_name, status, feature_flags')
            .eq('status', 'ĐANG LÀM')
            .ilike('id', 'NH%')
            .order('id', { ascending: true });

        if (staffError) throw staffError;

        // Filter staff who have enable_bonus_wallet flag
        const bonusStaffs = (staffList || []).filter(s => s.feature_flags?.enable_bonus_wallet === true);
        const staffIds = bonusStaffs.map(s => s.id);

        // 2. Fetch Bonus Ledger for these staffs
        const { data: ledger, error: ledgerError } = await supabase
            .from('KTVBonusLedger')
            .select('staff_id, points, type')
            .in('staff_id', staffIds);

        if (ledgerError) throw ledgerError;

        // 3. Aggregate data
        const statsMap: Record<string, { totalEarned: number, totalRedeemed: number, totalDeducted: number }> = {};
        staffIds.forEach(id => {
            statsMap[id] = { totalEarned: 0, totalRedeemed: 0, totalDeducted: 0 };
        });

        (ledger || []).forEach(tx => {
            const id = tx.staff_id;
            if (!statsMap[id]) return;

            const pts = Number(tx.points);
            if (tx.type === 'EARN') {
                statsMap[id].totalEarned += pts;
            } else if (tx.type === 'REDEEM') {
                statsMap[id].totalRedeemed += Math.abs(pts); // redeem is usually saved as negative in db, but we track absolute for display
            } else if (tx.type === 'DEDUCT') {
                statsMap[id].totalDeducted += Math.abs(pts);
            } else {
                // For any manual positive/negative points not strictly typed
                if (pts > 0) statsMap[id].totalEarned += pts;
                else statsMap[id].totalDeducted += Math.abs(pts);
            }
        });

        // 4. Format Output
        const result = bonusStaffs.map(s => {
            const stats = statsMap[s.id];
            const currentBalance = stats.totalEarned - stats.totalRedeemed - stats.totalDeducted;
            return {
                id: s.id,
                name: s.full_name,
                totalEarned: stats.totalEarned,
                totalRedeemed: stats.totalRedeemed,
                totalDeducted: stats.totalDeducted,
                currentBalance: currentBalance,
                vndEquivalent: currentBalance * 1000 // 1 point = 1000đ
            };
        });

        return NextResponse.json({ success: true, data: result });
    } catch (err: any) {
        console.error('❌ [Finance KTV Bonus Summary] Error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
