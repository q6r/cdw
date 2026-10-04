import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { ErrorBoundary, GuestOnly, PublicLayout, RequireAuth, ScrollManager } from "./routing";
import { PageLoader } from "../components/ui";
import Home from "../pages/Home";

const Catalog = lazy(() => import("../pages/Catalog"));
const PlanPage = lazy(() => import("../pages/PlanPage"));
const Divulgacoes = lazy(() => import("../pages/Divulgacoes"));
const Ranking = lazy(() => import("../pages/Ranking"));
const NotFound = lazy(() => import("../pages/NotFound"));
const Auth = lazy(() => import("../pages/Auth"));
const PasswordReset = lazy(() => import("../pages/PasswordReset"));

const Shell = lazy(() => import("../painel/Shell"));
const Overview = lazy(() => import("../painel/Overview"));
const TagEditor = lazy(() => import("../painel/TagEditor"));
const VoiceEditor = lazy(() => import("../painel/VoiceEditor"));
const PainelPlans = lazy(() => import("../painel/PlansPage"));
const Checkout = lazy(() => import("../painel/Checkout"));
const Payments = lazy(() => import("../painel/Payments"));
const PromoCheckout = lazy(() => import("../painel/PromoCheckout"));
const MyPromos = lazy(() => import("../painel/MyPromos"));
const Received = lazy(() => import("../painel/Received"));
const PainelRanking = lazy(() => import("../painel/RankingPage"));
const Profile = lazy(() => import("../painel/Profile"));

const AdminOverview = lazy(() => import("../admin/AdminOverview"));
const AdminOrders = lazy(() => import("../admin/AdminOrders"));
const AdminUsers = lazy(() => import("../admin/AdminUsers"));
const AdminVips = lazy(() => import("../admin/AdminVips"));
const AdminPlans = lazy(() => import("../admin/AdminPlans"));
const AdminPromos = lazy(() => import("../admin/AdminPromos"));
const AdminRevenue = lazy(() => import("../admin/AdminRevenue"));

export default function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/planos" element={<Catalog />} />
            <Route path="/planos/:planKey" element={<PlanPage />} />
            <Route path="/divulgacoes" element={<Divulgacoes />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/entrar" element={<GuestOnly><Auth mode="login" /></GuestOnly>} />
          <Route path="/criar-conta" element={<GuestOnly><Auth mode="register" /></GuestOnly>} />
          <Route path="/esqueci-senha" element={<GuestOnly><PasswordReset mode="forgot" /></GuestOnly>} />
          <Route path="/redefinir-senha" element={<PasswordReset mode="reset" />} />

          <Route path="/painel" element={<RequireAuth><Shell area="user" /></RequireAuth>}>
            <Route index element={<Overview />} />
            <Route path="tag" element={<TagEditor />} />
            <Route path="call" element={<VoiceEditor />} />
            <Route path="planos" element={<PainelPlans />} />
            <Route path="comprar/:planKey" element={<Checkout />} />
            <Route path="pagamentos" element={<Payments />} />
            <Route path="divulgacao/:promoKey" element={<PromoCheckout />} />
            <Route path="divulgacoes" element={<MyPromos />} />
            <Route path="recebidas" element={<Received />} />
            <Route path="ranking" element={<PainelRanking />} />
            <Route path="perfil" element={<Profile />} />
          </Route>

          <Route path="/admin" element={<RequireAuth admin><Shell area="admin" /></RequireAuth>}>
            <Route index element={<AdminOverview />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="usuarios" element={<AdminUsers />} />
            <Route path="vips" element={<AdminVips />} />
            <Route path="planos" element={<AdminPlans />} />
            <Route path="divulgacoes" element={<AdminPromos />} />
            <Route path="receita" element={<AdminRevenue />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export { ErrorBoundary };
