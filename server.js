import express from "express";

const app = express();

app.use(express.json({ type: "*/*" }));

app.get("/", (req, res) => {
  res.send("IVR Call Bot is running.");
});

// Telnyx webhook
app.post("/webhook", (req, res) => {
  console.log("Telnyx event:", JSON.stringify(req.body));
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(IVR Call Bot running on port ${PORT});
});
