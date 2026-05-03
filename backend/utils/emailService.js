const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'fitness.sliit@gmail.com',
    pass: 'ekfddgejhsaavdzy',
  },
});

const sendBookingConfirmationEmail = async ({ to, userName, booking, event, qrBuffer }) => {
  const eventDate = new Date(event.eventDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const shortId = booking._id.toString().slice(-8).toUpperCase();

  const discountRow = booking.discountAmount > 0
    ? `<tr>
        <td style="padding:8px 0;color:#c4b5fd;">Discount Applied</td>
        <td style="padding:8px 0;text-align:right;color:#4ade80;font-weight:bold;">
          - LKR ${booking.discountAmount.toFixed(2)}
        </td>
      </tr>`
    : '';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f0020;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0020;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#1a0035;border-radius:16px;overflow:hidden;border:1px solid rgba(124,58,237,0.3);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);padding:40px 32px;text-align:center;">
              <div style="font-size:42px;margin-bottom:8px;">🎉</div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                Booking Confirmed!
              </h1>
              <p style="margin:10px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">
                Thank you for booking with Eventify
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="color:#e2d9f3;font-size:16px;margin:0 0 8px;">
                Hi <strong style="color:#a78bfa;">${userName}</strong>,
              </p>
              <p style="color:#c4b5fd;font-size:15px;margin:0 0 28px;">
                Your booking is confirmed. Present the QR code below at the event entrance.
              </p>

              <!-- Booking Details Card -->
              <div style="background:#2d0050;border-radius:12px;padding:24px;margin-bottom:24px;
                          border:1px solid rgba(124,58,237,0.25);">
                <h2 style="margin:0 0 20px;color:#a78bfa;font-size:16px;text-transform:uppercase;
                            letter-spacing:1px;">📋 Booking Details</h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:10px 0;color:#9ca3af;font-size:14px;border-bottom:1px solid rgba(124,58,237,0.15);">
                      Booking ID
                    </td>
                    <td style="padding:10px 0;text-align:right;font-weight:700;color:#ffffff;font-size:14px;
                                border-bottom:1px solid rgba(124,58,237,0.15);font-family:monospace;">
                      #${shortId}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;color:#9ca3af;font-size:14px;border-bottom:1px solid rgba(124,58,237,0.15);">
                      Event
                    </td>
                    <td style="padding:10px 0;text-align:right;font-weight:700;color:#ffffff;font-size:14px;
                                border-bottom:1px solid rgba(124,58,237,0.15);">
                      ${event.title}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;color:#9ca3af;font-size:14px;border-bottom:1px solid rgba(124,58,237,0.15);">
                      Date
                    </td>
                    <td style="padding:10px 0;text-align:right;color:#c4b5fd;font-size:14px;
                                border-bottom:1px solid rgba(124,58,237,0.15);">
                      ${eventDate}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;color:#9ca3af;font-size:14px;border-bottom:1px solid rgba(124,58,237,0.15);">
                      Location
                    </td>
                    <td style="padding:10px 0;text-align:right;color:#c4b5fd;font-size:14px;
                                border-bottom:1px solid rgba(124,58,237,0.15);">
                      ${event.location}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;color:#9ca3af;font-size:14px;border-bottom:1px solid rgba(124,58,237,0.15);">
                      Tickets
                    </td>
                    <td style="padding:10px 0;text-align:right;color:#ffffff;font-size:14px;
                                border-bottom:1px solid rgba(124,58,237,0.15);">
                      ${booking.quantity} × LKR ${event.ticketPrice ? event.ticketPrice.toFixed(2) : '0.00'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;color:#9ca3af;font-size:14px;border-bottom:1px solid rgba(124,58,237,0.15);">
                      Subtotal
                    </td>
                    <td style="padding:10px 0;text-align:right;color:#ffffff;font-size:14px;
                                border-bottom:1px solid rgba(124,58,237,0.15);">
                      LKR ${booking.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                  ${discountRow}
                  <tr>
                    <td style="padding:14px 0 4px;color:#ffffff;font-size:17px;font-weight:800;">
                      Total Paid
                    </td>
                    <td style="padding:14px 0 4px;text-align:right;font-size:20px;font-weight:800;
                                color:#ec4899;">
                      LKR ${booking.finalAmount.toFixed(2)}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- QR Code -->
              <div style="text-align:center;padding:24px;background:#2d0050;border-radius:12px;
                          border:1px solid rgba(124,58,237,0.25);">
                <p style="color:#a78bfa;font-size:13px;font-weight:600;text-transform:uppercase;
                            letter-spacing:1px;margin:0 0 16px;">
                  🎫 Your Entry QR Code
                </p>
                <div style="display:inline-block;background:#ffffff;padding:12px;border-radius:10px;">
                  <img src="cid:qrcode" alt="Booking QR Code"
                       style="display:block;width:200px;height:200px;" />
                </div>
                <p style="color:#6b7280;font-size:12px;margin:14px 0 0;">
                  Booking ID: <span style="font-family:monospace;color:#c4b5fd;">#${shortId}</span>
                </p>
              </div>

              <!-- App notice -->
              <div style="margin-top:20px;padding:16px;background:rgba(124,58,237,0.08);
                          border-radius:10px;border:1px solid rgba(124,58,237,0.2);">
                <p style="color:#9ca3af;font-size:13px;margin:0;text-align:center;">
                  📱 You can also view your QR code anytime in the
                  <strong style="color:#a78bfa;">Eventify app</strong> under
                  <strong style="color:#a78bfa;">My Bookings</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f0020;padding:20px 32px;text-align:center;
                        border-top:1px solid rgba(124,58,237,0.2);">
              <p style="color:#4b5563;font-size:12px;margin:0;">
                © 2026 Eventify · This is an automated email, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: '"Eventify 🎟️" <fitness.sliit@gmail.com>',
    to,
    subject: `✅ Booking Confirmed — ${event.title} | #${shortId}`,
    html,
    attachments: [
      {
        filename: 'booking-qr.png',
        content: qrBuffer,
        cid: 'qrcode',
      },
    ],
  });
};

module.exports = { sendBookingConfirmationEmail };
