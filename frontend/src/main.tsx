import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import logo from "./assets/Secondary_Logo.svg";
import { CartProvider } from "./contexts/CartContext";
import { BrowserRouter } from "react-router-dom"; 

const favicon = document.createElement("link");
favicon.rel = "icon";
favicon.type = "image/svg+xml";
favicon.href = logo;
document.head.appendChild(favicon);

const root = createRoot(document.getElementById("root")!);

root.render(
  <BrowserRouter>                 
    <CartProvider>
      <App />
    </CartProvider>
  </BrowserRouter>
);
