import { Kafka, Producer } from "kafkajs";
import dotenv from "dotenv";
dotenv.config();

let producer: Producer;

export const connectKafka = async () => {
  try {
    const kafka = new Kafka({
      clientId: "user-service",
      brokers: [process.env.Kafka_Broker || "localhost:9092"],
    });

    producer = kafka.producer();
    await producer.connect();
    console.log("✅ connected to kafka producer (user-service)");
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

/*
 * ===========================================================================================
 *                              NOTES — user/src/producer.ts
 * ===========================================================================================
 *
 * PURPOSE: Kafka producer for the User Microservice. Publishes email messages to the
 * "send-mail" topic when a jobseeker applies to a job.
 *
 * DIFFERENCE FROM AUTH producer.ts:
 * - SIMPLER: Does NOT create topics (assumes auth service already created "send-mail")
 * - clientId: "user-service" (vs "auth-service")
 * - No admin client needed
 *
 * FUNCTIONS:
 * - connectKafka(): Connects to Kafka broker, initializes producer
 * - publishToTopic(topic, message): Sends JSON-stringified message to a Kafka topic
 *
 * USAGE: Called by controllers/user.ts applyForJob() to send confirmation emails.
 *
 * CONNECTIONS:
 * • index.ts → calls connectKafka() at startup
 * • controllers/user.ts → calls publishToTopic("send-mail", emailMessage)
 * • Utils Service consumer.ts → consumes from "send-mail" topic
 */
