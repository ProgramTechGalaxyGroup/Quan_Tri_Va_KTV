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
            .select('*')
            .eq('staff_id', techCode)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data
        });
    } catch (error: any) {
        console.error('Lỗi lấy lịch sử bonus:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
