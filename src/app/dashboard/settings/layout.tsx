
import { Breadcrumb } from '@/components/dashboard/breadcrumb';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Ajustes' }]} />
      <div className="mt-4">{children}</div>
    </div>
  );
}
