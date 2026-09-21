import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import usersRouter from "./routes/users";
import documentsRouter from "./routes/documents";
import organizationsRouter from "./routes/organizations";
// import { validateCloudinaryConfig } from "./lib/cloudinary";
import { validateSupabaseConfig } from "./lib/supabase";
import { uploadToCloudinary } from "./lib/cloudinary";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/documents", documentsRouter);
app.use("/api/v1/organizations", organizationsRouter);
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