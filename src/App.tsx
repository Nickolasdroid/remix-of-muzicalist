import { lazy, Suspense } from "react";
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

// Lazy-loaded routes — keep first-load bundle small so pages load fast on
// slower devices/networks. Index stays eager because it's the landing page.
const Feed = lazy(() => import("./pages/Feed"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Register = lazy(() => import("./pages/Register"));
const RegisterArtist = lazy(() => import("./pages/RegisterArtist"));
const RegisterUser = lazy(() => import("./pages/RegisterUser"));
const Categories = lazy(() => import("./pages/Categories"));
const CategoryArtists = lazy(() => import("./pages/CategoryArtists"));
const Counties = lazy(() => import("./pages/Counties"));
const CountyArtists = lazy(() => import("./pages/CountyArtists"));
const CountySpecializationArtists = lazy(() => import("./pages/CountySpecializationArtists"));
const Countries = lazy(() => import("./pages/Countries"));
const CountryArtists = lazy(() => import("./pages/CountryArtists"));
const Announcements = lazy(() => import("./pages/Announcements"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const ArtistProfile = lazy(() => import("./pages/ArtistProfile"));
const BookArtist = lazy(() => import("./pages/BookArtist"));
const Messages = lazy(() => import("./pages/Messages"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Search = lazy(() => import("./pages/Search"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const AllArtists = lazy(() => import("./pages/AllArtists"));
const ArtistAnalytics = lazy(() => import("./pages/ArtistAnalytics"));
const PlansPricing = lazy(() => import("./pages/PlansPricing"));
const MyPlan = lazy(() => import("./pages/MyPlan"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const BookingRequests = lazy(() => import("./pages/BookingRequests"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen bg-background" aria-hidden="true" />
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <GuestThemeGuard />
        <AutoTranslatePageText />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
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
            <Route path="/artist/:id" element={<ArtistProfile />} />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
