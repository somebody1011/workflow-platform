import express from "express";
import cors from "cors";
const PORT = 5000;
const app = express();
import usersRouter from "./routes/users";

app.use(cors());
app.use(express.json());
app.use("/api/v1/users", usersRouter);

app.get("/", (req, res) => {
    res.json({
        message: "Backend is running"
    });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});