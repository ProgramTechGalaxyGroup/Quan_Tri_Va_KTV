import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/components/NotificationProvider';

export const useSupportDashboard = () => {
    const { user } = useAuth();
    const [roomsToClean, setRoomsToClean] = useState<any[]>([]);
    const [myTasks, setMyTasks] = useState<any[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [loadingTasks, setLoadingTasks] = useState(true);
    
    const fetchRoomsToClean = async () => {
        setLoadingRooms(true);
        try {
            const { data, error } = await supabase
                .from('Bookings')
                .select('id, billCode, roomName, timeEnd, status')
                .eq('status', 'CLEANING');
            if (error) throw error;
            setRoomsToClean(data || []);
        } catch (error: any) {
            console.error('Error fetching rooms to clean:', error);
            alert('Lỗi khi lấy danh sách phòng dọn');
        } finally {
            setLoadingRooms(false);
        }
    };

    const fetchMyTasks = async () => {
        if (!user) return;
        setLoadingTasks(true);
        try {
            const res = await fetch(`/api/support/tasks?assignee_id=${user.id}&status=PENDING`);
            const json = await res.json();
            if (json.success) {
                setMyTasks(json.data);
            } else {
                throw new Error(json.error);
            }
        } catch (error: any) {
            console.error('Error fetching tasks:', error);
            alert('Lỗi khi lấy danh sách công việc');
        } finally {
            setLoadingTasks(false);
        }
    };

    const markRoomDone = async (bookingId: string, photoUrl: string) => {
        try {
            // In a real scenario we might save photoUrl to Booking or a new table
            const { error } = await supabase
                .from('Bookings')
                .update({ status: 'DONE' })
                .eq('id', bookingId);
            if (error) throw error;
            alert('Bàn giao phòng thành công');
            fetchRoomsToClean();
            return { success: true };
        } catch (error: any) {
            console.error('Error marking room done:', error);
            alert('Lỗi khi hoàn tất phòng');
            return { success: false, error: error.message };
        }
    };

    const markTaskDone = async (taskId: string, photoUrl: string) => {
        try {
            const res = await fetch('/api/support/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId, status: 'DONE', photo_url: photoUrl })
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            alert('Đã hoàn tất công việc');
            fetchMyTasks();
            return { success: true };
        } catch (error: any) {
            console.error('Error marking task done:', error);
            alert('Lỗi khi hoàn tất công việc');
            return { success: false, error: error.message };
        }
    };

    useEffect(() => {
        fetchRoomsToClean();
        fetchMyTasks();
        
        // Setup subscriptions for realtime updates
        const subBookings = supabase
            .channel('public:Bookings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Bookings' }, () => {
                fetchRoomsToClean();
            })
            .subscribe();

        const subTasks = supabase
            .channel('public:SupportTasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'SupportTasks' }, () => {
                fetchMyTasks();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subBookings);
            supabase.removeChannel(subTasks);
        };
    }, [user]);

    return {
        roomsToClean,
        myTasks,
        loadingRooms,
        loadingTasks,
        markRoomDone,
        markTaskDone,
        refreshRooms: fetchRoomsToClean,
        refreshTasks: fetchMyTasks
    };
};
