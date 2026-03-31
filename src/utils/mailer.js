const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendMail = async (to, subject, html) => {
  try {
    if (!process.env.SMTP_USER) {
      console.log('E-posta gönderimi atlandı (SMTP ayarları eksik):', subject);
      return;
    }
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Poiwood" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
  }
};

const sendOrderCreatedEmail = (userEmail, orderNumber, totalAmount) => {
  const subject = `Siparişiniz Alındı - ${orderNumber}`;
  const html = `
    <h2>Siparişiniz başarıyla oluşturuldu!</h2>
    <p>Merhaba,</p>
    <p><strong>${orderNumber}</strong> numaralı siparişinizi aldık.</p>
    <p>Sipariş tutarınız: <strong>${totalAmount} TL</strong></p>
    <p>Ödemeniz onaylandığında siparişiniz hazırlanmaya başlayacaktır.</p>
    <br>
    <p>Bizi tercih ettiğiniz için teşekkür ederiz.<br>Poiwood Ekibi</p>
  `;
  return sendMail(userEmail, subject, html);
};

const sendOrderPaidEmail = (userEmail, orderNumber) => {
  const subject = `Ödemeniz Onaylandı - ${orderNumber}`;
  const html = `
    <h2>Ödemeniz başarıyla alındı!</h2>
    <p>Merhaba,</p>
    <p><strong>${orderNumber}</strong> numaralı siparişinizin ödemesi onaylandı ve siparişiniz hazırlanmaya başlandı.</p>
    <p>Ürünleriniz kargoya verildiğinde size tekrar bilgi vereceğiz.</p>
    <br>
    <p>Poiwood Ekibi</p>
  `;
  return sendMail(userEmail, subject, html);
};

const sendOrderShippedEmail = (userEmail, orderNumber, cargoCompany, trackingNo) => {
  const subject = `Siparişiniz Kargoya Verildi - ${orderNumber}`;
  const html = `
    <h2>Siparişiniz Yola Çıktı!</h2>
    <p>Merhaba,</p>
    <p><strong>${orderNumber}</strong> numaralı siparişiniz <strong>${cargoCompany}</strong> firmasına teslim edilmiştir.</p>
    <p>Kargo Takip Numaranız: <strong>${trackingNo}</strong></p>
    <br>
    <p>İyi günlerde kullanmanızı dileriz.<br>Poiwood Ekibi</p>
  `;
  return sendMail(userEmail, subject, html);
};

module.exports = {
  sendMail,
  sendOrderCreatedEmail,
  sendOrderPaidEmail,
  sendOrderShippedEmail,
};
