import express from "express";
const PORT = 5000;
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Backend is running"
    });
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});