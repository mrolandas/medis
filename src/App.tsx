import { TreeDataProvider } from "./providers/TreeDataProvider";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthGate } from "./components/common/AuthGate";

export default function App() {
  return (
    <AuthGate>
      <TreeDataProvider>
        <AppLayout />
      </TreeDataProvider>
    </AuthGate>
  );
}
