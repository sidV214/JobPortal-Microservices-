import { Kafka, Producer, Admin } from "kafkajs";
import dotenv from "dotenv";
dotenv.config();

let producer: Producer;
let admin: Admin;

export const connectKafka = async () => {
  try {
    const kafka = new Kafka({
      clientId: "auth-service",
      brokers: [process.env.KAFKA_BROKER || process.env.Kafka_Broker || "localhost:9092"],
      ...(process.env.KAFKA_USERNAME && {
        ssl: true,
        sasl: {
          mechanism: "scram-sha-256",
          username: process.env.KAFKA_USERNAME,
          password: process.env.KAFKA_PASSWORD || "",
        },
      }),
    });

    admin = kafka.admin();
    await admin.connect();

    const topics = await admin.listTopics();

    if (!topics.includes("send-mail")) {
      await admin.createTopics({
        topics: [
          {
            topic: "send-mail",
            numPartitions: 1,
            replicationFactor: 1,
          },
        ],
      });
      console.log("✅ Topic 'send-mail' created");
    }

    await admin.disconnect();

    producer = kafka.producer();

    await producer.connect();

    console.log("✅ connected to kafka producer");
  } catch (error) {
    console.log("Failed to connect to kafka", error);
  }
};

export const publishToTopic = async (topic: string, message: any) => {
  if (!producer) {
    console.log("kafka producer is not initialized");
    return;
  }

  try {
    await producer.send({
      topic: topic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });
  } catch (error) {
    console.log("Failed to publish message to kafka", error);
  }
};

export const disconnectKafka = async () => {
  if (producer) {
    producer.disconnect();
  }
};

/*
 * ===========================================================================================
 *                              NOTES — auth/src/producer.ts
 * ===========================================================================================
 *
 * PURPOSE: Manages the Kafka producer for the Auth Microservice. Handles connecting to Kafka,
 * creating topics if they don't exist, and publishing messages to topics (primarily "send-mail").
 *
 * ROLE IN ARCHITECTURE: Backend → Auth Service → Message Queue Layer
 * Part of the event-driven architecture: Auth publishes → Utils Service consumes.
 *
 * VARIABLES:
 * - producer (Producer) → Kafka producer instance for sending messages
 * - admin (Admin) → Kafka admin client for topic management (create/list)
 *
 * FUNCTION: connectKafka()
 * - Creates a Kafka client with clientId "auth-service" and broker from env
 * - Uses admin client to check if "send-mail" topic exists
 * - If topic doesn't exist, creates it with 1 partition and 1 replication factor
 * - Disconnects admin client (no longer needed after setup)
 * - Connects the producer for message publishing
 * - Called once at app startup (in app.ts)
 *
 * FUNCTION: publishToTopic(topic, message)
 * - Validates producer is initialized
 * - Serializes message to JSON string
 * - Sends to specified Kafka topic
 * - Used by controllers/auth.ts for sending forgot-password emails
 *
 * FUNCTION: disconnectKafka()
 * - Gracefully disconnects the producer (for shutdown hooks)
 *
 * DATA FLOW:
 * forgotPassword controller → publishToTopic("send-mail", {to, subject, html})
 * → Kafka broker stores message → Utils Service consumer reads it → sends email via SMTP
 *
 * CONNECTIONS:
 * • app.ts → calls connectKafka() at startup
 * • controllers/auth.ts → calls publishToTopic() for email
 * • Utils Service consumer.ts → listens on "send-mail" topic
 *
 * INTERVIEW QUESTIONS:
 * 1. Why create the topic programmatically instead of manually?
 *    → Ensures the topic exists before any message is published (self-healing).
 * 2. Why disconnect the admin client after creating the topic?
 *    → Admin is only needed for setup. Keeping it open wastes resources.
 * 3. What happens if Kafka is down when the app starts?
 *    → connectKafka catches the error and logs it. The app still starts but emails won't work.
 */
