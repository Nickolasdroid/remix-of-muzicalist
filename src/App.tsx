import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Leaderboard from "./pages/Leaderboard";
import Register from "./pages/Register";
import RegisterArtist from "./pages/RegisterArtist";
import RegisterUser from "./pages/RegisterUser";
import Categories from "./pages/Categories";
import CategoryArtists from "./pages/CategoryArtists";
import Counties from "./pages/Counties";
import CountyArtists from "./pages/CountyArtists";
import CountySpecializationArtists from "./pages/CountySpecializationArtists";
import Countries from "./pages/Countries";
import CountryArtists from "./pages/CountryArtists";
import Announcements from "./pages/Announcements";
import About from "./pages/About";
import AboutUs from "./pages/AboutUs";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./pages/UserDashboard";
import ArtistProfile from "./pages/ArtistProfile";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Search from "./pages/Search";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AllArtists from "./pages/AllArtists";
import ArtistAnalytics from "./pages/ArtistAnalytics";
import PlansPricing from "./pages/PlansPricing";
import MyPlan from "./pages/MyPlan";
import HelpSupport from "./pages/HelpSupport";
import AdminDashboard from "./pages/AdminDashboard";
import BookingRequests from "./pages/BookingRequests";
import AdminRoute from "./components/AdminRoute";
import AutoTranslatePageText from "./components/AutoTranslatePageText";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AutoTranslatePageText />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
