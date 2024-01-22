const express = require("express");
const { KafkaClient, Producer, ConsumerGroup } = require("kafka-node");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const kafkaClientOptions = { kafkaHost: "kafka:9092" };
const kafkaClient = new KafkaClient(kafkaClientOptions);
const producer = new Producer(kafkaClient);

// In-memory store
let blockedUUIDs = new Set();

// POST /blocked endpoint
app.post("/blocked", (req, res) => {
  const uuids = req.body;
  uuids.forEach((uuid) => {
    const payload = [
      {
        topic: "blocked",
        messages: JSON.stringify({ uuid, time: new Date().toISOString() }),
        key: uuid,
      },
    ];
    producer.send(payload, (err, data) => {
      if (err) {
        console.error("Error sending message to Kafka:", err);
      }
    });
  });
  res.status(200).send("UUIDs processed");
});

// GET /blocked endpoint
app.get("/blocked", (req, res) => {
  console.log("Responding with Blocked UUIDs:", blockedUUIDs);
  res.json(Array.from(blockedUUIDs));
});

// Kafka Consumer
const consumerOptions = {
  kafkaHost: "kafka:9092",
  groupId: uuidv4(),
  fromOffset: "earliest",
};

const consumerGroup = new ConsumerGroup(consumerOptions, ["blocked"]);
consumerGroup.on("message", (message) => {
  const data = JSON.parse(message.value);
  console.log("Received message:", data);
  if (!blockedUUIDs.has(data.uuid)) {
    blockedUUIDs.add(data.uuid);
  }
});

// Error handling
producer.on("error", (err) => console.error("Producer error:", err));
consumerGroup.on("error", (err) => console.error("Consumer error:", err));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
