import { redirect } from 'next/navigation';

export default async function ScheduleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/schedules/${id}`);
}
