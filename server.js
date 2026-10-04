import express from "express";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_CONNECTION_ID = process.env.TELNYX_CONNECTION_ID;
const TELNYX_FROM_NUMBER = process.env.TELNYX_FROM_NUMBER;
const TEST_TO_NUMBER = process.env.TEST_TO_NUMBER;

app.get("/", (req, res) => {
  res.send("IVR Call Bot is running.");
});

// Start one authorized test call
app.post("/test-call", async (req, res) => {
  if (!TELNYX_API_KEY  !TELNYX_CONNECTION_ID 
      !TELNYX_FROM_NUMBER || !TEST_TO_NUMBER) {
    return res.status(500).json({
      error: "Telnyx environment variables are not configured yet."
    });
  }

  try {
    const response = await fetch("https://api.telnyx.com/v2/calls", {
      method: "POST",
      headers: {
        "Authorization": Bearer ${TELNYX_API_KEY},
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: TEST_TO_NUMBER,
        from: TELNYX_FROM_NUMBER,
        connection_id: TELNYX_CONNECTION_ID
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({
      message: "Test call started.",
      call: data.data
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not start test call." });
  }
});

// Telnyx webhook
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  const event = req.body?.data;
  const eventType = event?.event_type;
  const payload = event?.payload;

  console.log("Telnyx event:", eventType);

  if (!TELNYX_API_KEY || !payload?.call_control_id) return;

  const callId = payload.call_control_id;

  try {
    // When the test call is answered, present the IVR menu.
    if (eventType === "call.answered") {
      await fetch(
        https://api.telnyx.com/v2/calls/${callId}/actions/gather_using_speak,
        {
          method: "POST",
          headers: {
            "Authorization": Bearer ${TELNYX_API_KEY},
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            payload:
              "Hello. Press 1 for XYZ. Press 2 for ABC.",
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

    // When the caller presses 1 or 2, respond.
    if (eventType === "call.gather.ended") {
      const digit = payload.digits;

      let message;

      if (digit === "1") {
        message = "You selected XYZ.";
      } else if (digit === "2") {
        message = "You selected ABC.";
      } else {
        message = "Invalid selection.";
      }

      await fetch(
        https://api.telnyx.com/v2/calls/${callId}/actions/speak,
        {
          method: "POST",
          headers: {
            "Authorization": Bearer ${TELNYX_API_KEY},
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

app.listen(PORT, "0.0.0.0", () => {
  console.log("IVR Call Bot running on port " + PORT);
});
