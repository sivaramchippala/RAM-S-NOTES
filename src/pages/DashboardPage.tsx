import { Navbar } from '../components/dashboard/Navbar';
import { Sidebar } from '../components/dashboard/Sidebar';
import { RichTextEditor } from '../components/editor/RichTextEditor';

export function DashboardPage() {
  return (
    <div className="h-screen flex flex-col bg-white dark:bg-neutral-950">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <RichTextEditor />
      </div>
    </div>
  );
}
