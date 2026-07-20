import { useEffect, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AutoTranslatePageText from "./components/AutoTranslatePageText";
import ScrollToTop from "./components/ScrollToTop";
import GuestThemeGuard from "./components/GuestThemeGuard";
import AdminRoute from "./components/AdminRoute";
import MetaPixel from "./components/MetaPixel";
import { Capacitor } from "@capacitor/core";
import { lazyWithPreload } from "@/lib/lazyWithPreload";
import { registerPreload, preloadPopularRoutes } from "@/lib/routePreload";

// Lazy-loaded routes — keep first-load bundle small so pages load fast on
// slower devices/networks. Index stays eager because it's the landing page.
// lazyWithPreload = ca lazy, dar cu .preload() ca să scoatem pauza la navigare.
const Feed = lazyWithPreload(() => import("./pages/Feed"));
const Leaderboard = lazyWithPreload(() => import("./pages/Leaderboard"));
const Register = lazyWithPreload(() => import("./pages/Register"));
const RegisterArtist = lazyWithPreload(() => import("./pages/RegisterArtist"));
const RegisterUser = lazyWithPreload(() => import("./pages/RegisterUser"));
const Categories = lazyWithPreload(() => import("./pages/Categories"));
const CategoryArtists = lazyWithPreload(() => import("./pages/CategoryArtists"));
const Counties = lazyWithPreload(() => import("./pages/Counties"));
const CountyArtists = lazyWithPreload(() => import("./pages/CountyArtists"));
const CountySpecializationArtists = lazyWithPreload(() => import("./pages/CountySpecializationArtists"));
const Countries = lazyWithPreload(() => import("./pages/Countries"));
const CountryArtists = lazyWithPreload(() => import("./pages/CountryArtists"));
const Announcements = lazyWithPreload(() => import("./pages/Announcements"));
const AboutUs = lazyWithPreload(() => import("./pages/AboutUs"));
const Login = lazyWithPreload(() => import("./pages/Login"));
const ResetPassword = lazyWithPreload(() => import("./pages/ResetPassword"));
const Dashboard = lazyWithPreload(() => import("./pages/Dashboard"));
const UserDashboard = lazyWithPreload(() => import("./pages/UserDashboard"));
const ArtistProfileRoute = lazyWithPreload(() => import("./pages/ArtistProfileRoute"));
const BookArtist = lazyWithPreload(() => import("./pages/BookArtist"));
const Messages = lazyWithPreload(() => import("./pages/Messages"));
const Notifications = lazyWithPreload(() => import("./pages/Notifications"));
const Search = lazyWithPreload(() => import("./pages/Search"));
const PrivacyPolicy = lazyWithPreload(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazyWithPreload(() => import("./pages/TermsOfService"));
const AllArtists = lazyWithPreload(() => import("./pages/AllArtists"));
const ArtistAnalytics = lazyWithPreload(() => import("./pages/ArtistAnalytics"));
const PlansPricing = lazyWithPreload(() => import("./pages/PlansPricing"));
const MyPlan = lazyWithPreload(() => import("./pages/MyPlan"));
const HelpSupport = lazyWithPreload(() => import("./pages/HelpSupport"));
const AdminDashboard = lazyWithPreload(() => import("./pages/AdminDashboard"));
const AdminEmailCampaigns = lazyWithPreload(() => import("./pages/AdminEmailCampaigns"));
const AdminNewCampaign = lazyWithPreload(() => import("./pages/AdminNewCampaign"));
const AdminCampaignDetail = lazyWithPreload(() => import("./pages/AdminCampaignDetail"));
const AdminEmailTemplates = lazyWithPreload(() => import("./pages/AdminEmailTemplates"));
const AdminEditTemplate = lazyWithPreload(() => import("./pages/AdminEditTemplate"));
const AdminModeration = lazyWithPreload(() => import("./pages/AdminModeration"));
const BookingRequests = lazyWithPreload(() => import("./pages/BookingRequests"));
const NotFound = lazyWithPreload(() => import("./pages/NotFound"));

// Leagă fiecare path public de preload-ul lui, ca PrefetchLink (hover/focus)
// și prefetch-ul la idle să știe ce chunk să ceară.
registerPreload("/feed", Feed.preload);
registerPreload("/categories", Categories.preload);
registerPreload("/categories/", CategoryArtists.preload);
registerPreload("/leaderboard", Leaderboard.preload);
registerPreload("/countries", Countries.preload);
registerPreload("/countries/", CountryArtists.preload);
registerPreload("/counties", Counties.preload);
registerPreload("/counties/", CountyArtists.preload);
registerPreload("/announcements", Announcements.preload);
registerPreload("/about", AboutUs.preload);
registerPreload("/login", Login.preload);
registerPreload("/reset-password", ResetPassword.preload);
registerPreload("/register", Register.preload);
registerPreload("/register/artist", RegisterArtist.preload);
registerPreload("/register/user", RegisterUser.preload);
registerPreload("/dashboard", Dashboard.preload);
registerPreload("/user-dashboard", UserDashboard.preload);
registerPreload("/artist/", ArtistProfileRoute.preload);
registerPreload("/book/", BookArtist.preload);
registerPreload("/messages", Messages.preload);
registerPreload("/notifications", Notifications.preload);
registerPreload("/search", Search.preload);
registerPreload("/artists", AllArtists.preload);
registerPreload("/analytics", ArtistAnalytics.preload);
registerPreload("/privacy-policy", PrivacyPolicy.preload);
registerPreload("/terms-of-service", TermsOfService.preload);
registerPreload("/plans", PlansPricing.preload);
registerPreload("/my-plan", MyPlan.preload);
registerPreload("/help", HelpSupport.preload);
registerPreload("/booking-requests", BookingRequests.preload);

const queryClient = new QueryClient();

// Fallback transparent: nu introduce flash de background. Randăm ce era
// (ScrollToTop lasă poziția), doar ținem layout-ul până vine chunk-ul.
const RouteFallback = () => (
  <div className="min-h-screen bg-background" aria-hidden="true" />
);

// Preîncarcă la idle rutele cele mai vizitate, ca prima navigare spre ele
// să fie deja din cache.
const RoutePrefetcher = () => {
  useEffect(() => {
    preloadPopularRoutes([
      "/artists",
      "/categories",
      "/search",
      "/countries",
    ]);
  }, []);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <MetaPixel />
        <GuestThemeGuard />
        <AutoTranslatePageText />
        <RoutePrefetcher />
        <Suspense fallback={<RouteFallback />}>
          <main>
          <Routes>
            <Route
  path="/"
  element={Capacitor.isNativePlatform() ? <Login /> : <Index />}
/>
            <Route path="/feed" element={<Feed />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/:category" element={<CategoryArtists />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/countries" element={<Countries />} />
            <Route path="/countries/:country" element={<CountryArtists />} />
            <Route path="/counties" element={<Counties />} />
            <Route path="/counties/:county" element={<CountyArtists />} />
            <Route path="/counties/:county/:specialization" element={<CountySpecializationArtists />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/artist" element={<RegisterArtist />} />
            <Route path="/register/user" element={<RegisterUser />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/artist/:id" element={<ArtistProfileRoute />} />
            <Route path="/book/:id" element={<BookArtist />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/search" element={<Search />} />
            <Route path="/artists" element={<AllArtists />} />
            <Route path="/analytics" element={<ArtistAnalytics />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/plans" element={<PlansPricing />} />
            <Route path="/my-plan" element={<MyPlan />} />
            <Route path="/help" element={<HelpSupport />} />
            <Route path="/booking-requests" element={<BookingRequests />} />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/communications/campaigns"
              element={
                <AdminRoute>
                  <AdminEmailCampaigns />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/communications/campaigns/new"
              element={
                <AdminRoute>
                  <AdminNewCampaign />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/communications/campaigns/:id"
              element={
                <AdminRoute>
                  <AdminCampaignDetail />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/communications/templates"
              element={
                <AdminRoute>
                  <AdminEmailTemplates />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/communications/templates/new"
              element={
                <AdminRoute>
                  <AdminEditTemplate mode="new" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/communications/templates/:id"
              element={
                <AdminRoute>
                  <AdminEditTemplate mode="edit" />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/moderation"
              element={
                <AdminRoute>
                  <AdminModeration />
                </AdminRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </main>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
