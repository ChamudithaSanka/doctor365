const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Appointment = require("./models/Appointment");
const connectDB = require("./config/db");
const appointmentRoutes = require("./routes/appointmentRoutes");
const errorHandler = require("./middleware/errorMiddleware");
const { sendInternalNotification } = require("./utils/notificationClient");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: process.env.SERVICE_NAME || "appointment-service",
  });
});

// Routes
app.use("/api/appointments", appointmentRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5004;

const parseAppointmentDateTime = (appointment) => {
  const date = new Date(appointment.appointmentDate);
  const [hours, minutes] = String(appointment.appointmentTime).split(':').map((value) => Number(value));

  if (Number.isNaN(date.getTime()) || Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
};

const startReminderScheduler = () => {
  const scanReminders = async () => {
    try {
      const appointments = await Appointment.find({
        status: { $in: ['pending', 'confirmed'] },
        reminderSentAt: null,
      });

      const now = new Date();
      const reminderWindowMs = 24 * 60 * 60 * 1000;

      for (const appointment of appointments) {
        const appointmentDateTime = parseAppointmentDateTime(appointment);

        if (!appointmentDateTime) {
          continue;
        }

        const timeUntilAppointment = appointmentDateTime.getTime() - now.getTime();

        if (timeUntilAppointment > 0 && timeUntilAppointment <= reminderWindowMs) {
          await sendInternalNotification({
            userId: appointment.patientId,
            type: 'appointment.reminder',
            title: 'Appointment reminder',
            message: `Reminder: your appointment is on ${appointment.appointmentDate.toDateString()} at ${appointment.appointmentTime}.`,
            metadata: {
              appointmentId: appointment._id,
              doctorId: appointment.doctorId,
            },
          });

          await sendInternalNotification({
            userId: appointment.doctorId,
            type: 'appointment.reminder',
            title: 'Appointment reminder',
            message: `Reminder: you have an appointment on ${appointment.appointmentDate.toDateString()} at ${appointment.appointmentTime}.`,
            metadata: {
              appointmentId: appointment._id,
              patientId: appointment.patientId,
            },
          });

          appointment.reminderSentAt = new Date();
          await appointment.save();
        }
      }
    } catch (error) {
      console.error('Reminder scheduler failed:', error.message);
    }
  };

  scanReminders();
  setInterval(scanReminders, 10 * 60 * 1000);
};

async function startServer() {
  try {
    await connectDB();
    startReminderScheduler();

    app.listen(PORT, () => {
      console.log(`${process.env.SERVICE_NAME || "appointment-service"} running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Service startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
