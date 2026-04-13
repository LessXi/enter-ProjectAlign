import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import Inventory from "./pages/Inventory";
import Inbound from "./pages/Inbound";
import Outbound from "./pages/Outbound";
import PurchaseOrders from "./pages/PurchaseOrders";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

export const routers = [
  {
    path: "/",
    name: "layout",
    element: <Layout />,
    children: [
      { path: "/", name: "home", element: <Index /> },
      { path: "/inventory", name: "inventory", element: <Inventory /> },
      { path: "/inbound", name: "inbound", element: <Inbound /> },
      { path: "/outbound", name: "outbound", element: <Outbound /> },
      { path: "/purchase-orders", name: "purchase-orders", element: <PurchaseOrders /> },
      { path: "/reports", name: "reports", element: <Reports /> },
    ],
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
