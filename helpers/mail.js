const nodemailer = require("nodemailer");

const sendMail=async (body,passLink) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: body.email,
      subject: "Recover your Password",
      html: `<p>Hello, Please click the link button below to change your password.</p><a href="http://localhost:8000/forgotPassword/${passLink}">Click here</a>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return "success";
  } catch (error) {
    console.log(error);
    return "error";
  }
};

const otpEmail = async (body, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: "styles4ubusiness@gmail.com",
      to: body.email,
      subject: "Otp verification to login",
      html: `<p>Thank you for choosing our platform. As an additional security measure, we have generated a One-Time Password (OTP) for you to complete the login process.<br><br>
        Your OTP is: <bold>${otp}</bold>
      <br><br>
        Please use this OTP within the next 2 minutes to finish setting up your account. If you didn't request this OTP or need any assistance, please contact our support team immediately.
        <br><br>
        Best regards,<br> <bold>Styles4usupporteam</bold>
        </p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return "success";
  } catch (error) {
    console.log(error);
    return "error";
  }
};
module.exports = {
  otpEmail,
  sendMail
};
