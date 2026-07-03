import { Sidebar } from "./sidebar";
import { Topbar, type OperationalAlert } from "./topbar";
import { getGlobalOperationalAlerts } from "./operational-alerts";

type AppShellProps = {
  children: React.ReactNode;
  mode?: "app" | "demo";
  operationalAlerts?: OperationalAlert[];
};

export async function AppShell({ children, mode = "app", operationalAlerts }: AppShellProps) {
  const alerts = operationalAlerts ?? await getGlobalOperationalAlerts(mode);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <Sidebar mode={mode} />
      <main className="min-w-0 flex-1">
        <Topbar mode={mode} operationalAlerts={alerts} />
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
