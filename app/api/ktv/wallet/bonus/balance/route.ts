import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const techCode = searchParams.get('techCode');

    if (!techCode) {
        return NextResponse.json({ success: false, error: 'Thiếu mã KTV' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('KTVBonusLedger')
            .select('points')
            .eq('staff_id', techCode);

        if (error) throw error;

        const totalPoints = data.reduce((sum, record) => sum + (record.points || 0), 0);
        
        // Trả về kèm số điểm tương đương VNĐ
        return NextResponse.json({
            success: true,
            data: {
                points: totalPoints,
                vnd_value: totalPoints * 1000
            }
        });
    } catch (error: any) {
        console.error('Lỗi tính điểm bonus:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
