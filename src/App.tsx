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
import Announcements from "./pages/Announcements";
import About from "./pages/About";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ArtistProfile from "./pages/ArtistProfile";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:category" element={<CategoryArtists />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/counties" element={<Counties />} />
          <Route path="/counties/:county" element={<CountyArtists />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/artist" element={<RegisterArtist />} />
          <Route path="/register/user" element={<RegisterUser />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/artist/:id" element={<ArtistProfile />} />
          <Route path="/messages" element={<Messages />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
