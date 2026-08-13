import { EstablishmentList } from "../components/EstablishmentList";
import { DashboardLayout } from "../layouts/DashboardLayout";

export const HomePage = () => {
  return (
    <DashboardLayout>
      <EstablishmentList />
    </DashboardLayout>
  );
};
