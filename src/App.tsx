import { TreeDataProvider } from "./providers/TreeDataProvider";
import { AppLayout } from "./components/layout/AppLayout";

export default function App() {
  return (
    <TreeDataProvider>
      <AppLayout />
    </TreeDataProvider>
  );
}
