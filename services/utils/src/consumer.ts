import { Kafka } from "kafkajs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const startSendMailConsumer = async () => {
  try {
    const kafka = new Kafka({
      clientId: "mail-service",
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

    const consumer = kafka.consumer({ groupId: "mail-service-group" });

    await consumer.connect();

    const topicName = "send-mail";

    await consumer.subscribe({ topic: topicName, fromBeginning: false });

    console.log("✅ Mail service consumer started, listening for sending mail");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const { to, subject, html } = JSON.parse(
            message.value?.toString() || "{}"
          );

          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          await transporter.sendMail({
            from: "JobNexus <no-reply>",
            to,
            subject,
            html,
          });

          console.log(`Mail has been sent to ${to}`);
        } catch (error) {
          console.log("Failed to send mail", error);
        }
      },
    });
  } catch (error) {
    console.log("failed to start kafka consumer", error);
  }
};

/*
 * ===========================================================================================
 *                              NOTES — utils/src/consumer.ts
 * ===========================================================================================
 *
 * PURPOSE: Kafka consumer that listens on "send-mail" topic and sends emails via Gmail SMTP.
 * This is the CENTRAL email sending service for the entire JobNexus platform.
 *
 * ROLE IN ARCHITECTURE: Backend → Utils Service (Port 5001) → Message Queue Consumer
 * This is the ONLY service that actually sends emails. All other services publish to Kafka.
 *
 * FUNCTION: startSendMailConsumer()
 * STEP-BY-STEP DATA FLOW:
 * 1. Create Kafka client with clientId "mail-service"
 * 2. Create consumer with groupId "mail-service-group"
 * 3. Subscribe to "send-mail" topic (fromBeginning: false → only new messages)
 * 4. For each message:
 *    a. Parse JSON to extract { to, subject, html }
 *    b. Create nodemailer transporter with Gmail SMTP (port 465, SSL)
 *    c. Send email from "JobNexus <no-reply>" to the recipient
 *    d. Log success or catch errors silently
 *
 * EMAIL SOURCES (who publishes to "send-mail"):
 * 1. Auth Service → forgot password reset emails
 * 2. User Service → job application confirmation emails
 * 3. Job Service → application status update emails (Hired/Rejected)
 *
 * SMTP CONFIGURATION:
 * - Host: smtp.gmail.com (Google's SMTP server)
 * - Port: 465 (SSL, not TLS on 587)
 * - SMTP_USER: Gmail address (from .env)
 * - SMTP_PASS: Gmail App Password (NOT the account password — requires 2FA app password)
 *
 * WHY fromBeginning: false?
 * → Only processes new messages. If the service restarts, it doesn't resend old emails.
 *
 * WHY groupId: "mail-service-group"?
 * → Kafka consumer groups ensure each message is only processed by ONE consumer instance.
 *   If you scale to 3 Utils instances, each email is sent by exactly one of them.
 *
 * CONNECTIONS:
 * • index.ts (utils) → calls startSendMailConsumer() at startup
 * • Auth producer → publishes reset password emails
 * • User producer → publishes application confirmation emails
 * • Job producer → publishes status update emails
 *
 * INTERVIEW QUESTIONS:
 * 1. Why centralize email sending in one service?
 *    → Single SMTP configuration, DRY principle, easier to swap email providers later.
 * 2. What happens if email sending fails?
 *    → Error is caught and logged. The message is consumed (not retried). No dead-letter queue.
 * 3. Why use Gmail SMTP instead of a service like SendGrid?
 *    → Simpler for development. Production would use SendGrid/SES for higher limits.
 */
