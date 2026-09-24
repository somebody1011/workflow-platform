import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import usersRouter from "./routes/users";
import documentsRouter from "./routes/documents";
import organizationsRouter from "./routes/organizations";
import organizationMembersRouter from "./routes/organization-members";
import workflowsRouter from "./routes/workflows";
import approvalRequestsRouter from "./routes/approval-requests";
import approvalActionsRouter from "./routes/approval-actions";
// import { validateCloudinaryConfig } from "./lib/cloudinary";
import { validateSupabaseConfig } from "./lib/supabase";
import { uploadToCloudinary } from "./lib/cloudinary";

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.NGROK_URL ? [process.env.NGROK_URL] : []),
])

// ngrok free tunnels get a new subdomain per session, so match the domain
// suffix instead of an exact URL.
const isAllowedOrigin = (origin?: string) => {
  if (!origin || allowedOrigins.has(origin)) return true
  try {
    const { hostname } = new URL(origin)
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".ngrok-free.dev") ||
      hostname.endsWith(".ngrok-free.app") ||
      hostname.endsWith(".ngrok.app") ||
      hostname.endsWith(".ngrok.io")
    )
  } catch {
    return false
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/documents", documentsRouter);
app.use("/api/v1/organizations", organizationsRouter);
app.use("/api/v1/organization-members", organizationMembersRouter);
app.use("/api/v1/workflows", workflowsRouter);
app.use("/api/v1/approval-requests", approvalRequestsRouter);
app.use("/api/v1/approval-requests", approvalActionsRouter);
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
);

// validateCloudinaryConfig();
validateSupabaseConfig();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});