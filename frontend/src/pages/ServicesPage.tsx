import { EstablishmentList } from "../components/EstablishmentList";
import { DashboardLayout } from "../layouts/DashboardLayout";

export const ServicesPage = () => {
  return (
    <DashboardLayout variant="services">
      <EstablishmentList />
    </DashboardLayout>
  );
};
