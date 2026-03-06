const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function emailTemplate(titre, contenu) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Arial', sans-serif; background: #0a0e1a; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #0f1524; border-radius: 16px; overflow: hidden; border: 1px solid rgba(0,87,255,0.2); }
        .header { background: linear-gradient(135deg, #0057FF, #0080ff); padding: 2rem; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 1.8rem; }
        .header p { color: rgba(255,255,255,0.7); margin: 0.5rem 0 0; }
        .body { padding: 2rem; color: #8892a4; line-height: 1.7; }
        .body h2 { color: white; font-size: 1.3rem; margin-bottom: 1rem; }
        .body p { margin-bottom: 1rem; }
        .cta { display: block; background: linear-gradient(135deg, #0057FF, #0080ff); color: white; text-decoration: none; padding: 1rem 2rem; border-radius: 10px; text-align: center; font-weight: 700; margin: 1.5rem 0; }
        .footer { padding: 1rem 2rem; text-align: center; color: #4a5568; font-size: 0.8rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .badge { display: inline-block; background: rgba(0,87,255,0.2); color: #00E5FF; padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ SportConnect</h1>
          <p>Ta plateforme sportive</p>
        </div>
        <div class="body">
          <span class="badge">NOTIFICATION</span>
          <h2>${titre}</h2>
          ${contenu}
          <a href="http://${process.env.APP_URL || "localhost"}" class="cta">
            Voir sur SportConnect →
          </a>
        </div>
        <div class="footer">
          © 2026 SportConnect — Tu reçois cet email car tu es inscrit sur SportConnect
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendEmail(to, subject, titre, contenu) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL] Pas de config SMTP — email non envoyé à ${to}: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"SportConnect" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: emailTemplate(titre, contenu),
    });
    console.log(`[EMAIL] Envoyé à ${to}: ${subject}`);
  } catch (err) {
    console.error(`[EMAIL] Erreur:`, err.message);
  }
}

// Email nouveau message
async function emailNouveauMessage(destinataire, expediteur) {
  await sendEmail(
    destinataire.email,
    `💬 Nouveau message de ${expediteur.prenom} ${expediteur.nom}`,
    `Tu as un nouveau message !`,
    `<p>Bonjour <strong>${destinataire.prenom}</strong>,</p>
     <p><strong>${expediteur.prenom} ${expediteur.nom}</strong> t'a envoyé un message sur SportConnect.</p>
     <p>Connecte-toi pour lire et répondre à son message !</p>`
  );
}

// Email nouvelle évaluation
async function emailNouvelleEvaluation(evalue, evaluateur, note) {
  const stars = "★".repeat(note) + "☆".repeat(5 - note);
  await sendEmail(
    evalue.email,
    `⭐ ${evaluateur.prenom} ${evaluateur.nom} t'a évalué ${stars}`,
    `Tu as reçu une nouvelle évaluation !`,
    `<p>Bonjour <strong>${evalue.prenom}</strong>,</p>
     <p><strong>${evaluateur.prenom} ${evaluateur.nom}</strong> t'a donné une note de <strong>${note}/5</strong> ${stars}</p>
     <p>Connecte-toi pour voir son commentaire et ta note moyenne !</p>`
  );
}

// Email rejoindre événement
async function emailEvenementRejoint(organisateur, participant, evenement) {
  await sendEmail(
    organisateur.email,
    `📅 ${participant.prenom} ${participant.nom} a rejoint ton événement`,
    `Quelqu'un a rejoint ton événement !`,
    `<p>Bonjour <strong>${organisateur.prenom}</strong>,</p>
     <p><strong>${participant.prenom} ${participant.nom}</strong> vient de rejoindre ton événement :</p>
     <p style="background: rgba(0,87,255,0.1); padding: 1rem; border-radius: 8px; color: white;">
       📅 <strong>${evenement.titre}</strong><br>
       📍 ${evenement.ville}
     </p>
     <p>Connecte-toi pour voir tous les participants !</p>`
  );
}

module.exports = { sendEmail, emailNouveauMessage, emailNouvelleEvaluation, emailEvenementRejoint };
