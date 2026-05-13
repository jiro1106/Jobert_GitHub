import { Outlet } from "react-router";
import StatusStrip from "../components/StatusStrip";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileStickyBar from "../components/MobileStickyBar";
import FloatingChatbot from "../components/chatbot/FloatingChatbot";

export default function RootLayout() {
  return (
    <>
      <StatusStrip />
      <Navbar />
      <Outlet />
      <Footer />
      <MobileStickyBar />
      <FloatingChatbot />
    </>
  );
}
