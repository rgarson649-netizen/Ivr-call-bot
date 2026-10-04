import express from "express";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_CONNECTION_ID = process.env.TELNYX_CONNECTION_ID;
const TELNYX_FROM_NUMBER = process.env.TELNYX_FROM_NUMBER;
const TEST_TO_NUMBER = process.env.TEST_TO_NUMBER;

app.get("/", function (req, res) {
  res.send("IVR Call Bot is running.");
});

app.post("/test-call", async function (req, res) {
  const missing = [];

  if (typeof TELNYX_API_KEY === "undefined") {
    missing.push("TELNYX_API_KEY");
  }

  if (typeof TELNYX_CONNECTION_ID === "undefined") {
    missing.push("TELNYX_CONNECTION_ID");
  }

  if (typeof TELNYX_FROM_NUMBER === "undefined") {
    missing.push("TELNYX_FROM_NUMBER");
  }

  if (typeof TEST_TO_NUMBER === "undefined") {
    missing.push("TEST_TO_NUMBER");
  }

  if (missing.length > 0) {
    return res.status(500).json({
      error: "Missing environment variables",
      missing: missing
    });
  }

  try {
    const response = await fetch("https://api.telnyx.com/v2/calls", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + TELNYX_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: TEST_TO_NUMBER,
        from: TELNYX_FROM_NUMBER,
        connection_id: TELNYX_CONNECTION_ID
      })
    });

    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    console.error("Call error:", error);
    res.status(500).json({
      error: "Could not start call."
    });
  }
});

app.post("/webhook", async function (req, res) {
  res.sendStatus(200);

  const body = req.body || {};
  const event = body.data || {};
  const eventType = event.event_type || "";
  const payload = event.payload || {};

  console.log("Telnyx event:", eventType);

  if (typeof TELNYX_API_KEY === "undefined") {
    return;
  }

  const callId = payload.call_control_id;

  if (typeof callId === "undefined") {
    return;
  }

  try {
    if (eventType === "call.answered") {
      await fetch(
        "https://api.telnyx.com/v2/calls/" +
          callId +
          "/actions/gather_using_speak",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + TELNYX_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            payload: "Hello. Press 1 for XYZ. Press 2 for ABC.",
            language: "en-US",
            voice: "female",
            minimum_digits: 1,
            maximum_digits: 1,
            valid_digits: "12",
            timeout_millis: 10000
          })
        }
      );
    }

    if (eventType === "call.gather.ended") {
      const digit = payload.digits;
      let message = "Invalid selection.";

      if (digit === "1") {
        message = "You selected XYZ.";
      }

      if (digit === "2") {
        message = "You selected ABC.";
      }

      await fetch(
        "https://api.telnyx.com/v2/calls/" +
          callId +
          "/actions/speak",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + TELNYX_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            payload: message,
            language: "en-US",
            voice: "female"
          })
        }
      );
    }
  } catch (error) {
    console.error("Call Control error:", error);
  }
});

app.listen(PORT, "0.0.0.0", function () {
  console.log("IVR Call Bot running on port " + PORT);
});
