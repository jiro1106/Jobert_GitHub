import { motion } from "framer-motion";
import logo from "../assets/full_logo.png";

const PRODUCT_LINKS = [
  "Route forecast",
  "Coverage map",
  "Trip mode (app)",
  "SIM picker",
];
const DATA_LINKS = [
  "Methodology",
  "Sources & accuracy",
  "Contribute",
  "API access",
];

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 48,
        borderTop: "1px solid var(--line)",
        background: "white",
        padding: "28px 16px 24px",
      }}
      className="md:!mt-16 md:!pt-9 md:!pb-7 md:!px-7"
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 28,
        }}
        className="md:!grid-cols-[1.4fr_1fr_1fr_1fr] md:!gap-9"
      >
        {/* Brand */}
        <div
          style={{ gridColumn: "1 / -1", maxWidth: 280 }}
          className="md:!col-auto"
        >
          <motion.a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ opacity: 0.85 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              width: "fit-content",
              cursor: "pointer",
            }}
          >
            <img
              src={logo}
              alt="SignalPH Logo"
              style={{ height: 80, width: "auto" }}
            />
          </motion.a>
          <p
            style={{
              fontSize: 12.5,
              color: "var(--ink-4)",
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            Predictive, route-based mobile network coverage estimation for the
            Philippines. Built with NTC data and community readings.
          </p>
        </div>

        <FooterCol title="Product" links={PRODUCT_LINKS} />
        <FooterCol title="Data" links={DATA_LINKS} />
      </div>

      <div
        style={{
          maxWidth: 1180,
          margin: "24px auto 0",
          paddingTop: 18,
          borderTop: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          fontFamily: "var(--mono)",
          fontSize: 11,
          color: "var(--ink-5)",
        }}
        className="sm:!flex-row sm:!justify-between"
      >
        <span>© 2026 SignalPH</span>
        <span>Last data refresh · 4 min ago</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--ink-5)",
          marginBottom: 12,
          fontWeight: 600,
        }}
      >
        {title}
      </h4>
      <ul
        style={{
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {links.map((link) => (
          <li key={link}>
            <a href="#" style={{ fontSize: 13, color: "var(--ink-3)" }}>
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
