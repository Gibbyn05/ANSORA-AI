// E-posttjeneste via Resend
// Alle e-poster sendes server-side

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const fromEmail = options.from || process.env.FROM_EMAIL || 'noreply@ansora.no'

  try {
    // Bruk Resend API direkte via fetch for å unngå bundle-problemer
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Ansora <${fromEmail}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('E-postfeil:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Nettverksfeil ved e-postsending:', error)
    return { success: false, error: 'Nettverksfeil' }
  }
}

// Maler for e-poster
export function createRejectionEmailHtml(params: {
  candidateName: string
  jobTitle: string
  companyName: string
  emailBody: string
}): string {
  return `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Inter, Arial, sans-serif; color: #555555; background: #F8FBFF; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0D1B3E; padding: 32px; text-align: center; }
    .header h1 { color: white; font-size: 24px; margin: 0; }
    .body { padding: 40px; }
    .footer { background: #F8FBFF; padding: 24px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ansora</h1>
    </div>
    <div class="body">
      <p>${params.emailBody.replace(/\n/g, '<br>')}</p>
    </div>
    <div class="footer">
      <p>Ansora AI-rekrutteringsplattform &bull; <a href="${process.env.NEXT_PUBLIC_APP_URL}">ansora.no</a></p>
    </div>
  </div>
</body>
</html>`
}

export function createReferenceEmailHtml(params: {
  refereeName: string
  candidateName: string
  jobTitle: string
  companyName: string
  formUrl: string
}): string {
  return `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Inter, Arial, sans-serif; color: #555555; background: #F8FBFF; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0D1B3E; padding: 32px; text-align: center; }
    .header h1 { color: white; font-size: 24px; margin: 0; }
    .body { padding: 40px; }
    .btn { display: inline-block; background: #1A73E8; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
    .footer { background: #F8FBFF; padding: 24px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ansora – Referanseforespørsel</h1>
    </div>
    <div class="body">
      <p>Kjære ${params.refereeName},</p>
      <p>${params.candidateName} har søkt stillingen <strong>${params.jobTitle}</strong> hos <strong>${params.companyName}</strong> og har oppgitt deg som referanse.</p>
      <p>Vi setter stor pris på om du kan ta deg noen minutter til å fylle ut et kort referanseskjema. Det tar ca. 3-5 minutter og hjelper oss å vurdere kandidaten på en rettferdig måte.</p>
      <a href="${params.formUrl}" class="btn">Fyll ut referanseskjema</a>
      <p>Takk for din tid!</p>
      <p>Med vennlig hilsen,<br>Rekrutteringsteamet via Ansora</p>
    </div>
    <div class="footer">
      <p>Ansora AI-rekrutteringsplattform &bull; <a href="${process.env.NEXT_PUBLIC_APP_URL}">ansora.no</a></p>
    </div>
  </div>
</body>
</html>`
}

export function createOfferEmailHtml(params: {
  candidateName: string
  jobTitle: string
  companyName: string
  startDate: string
  salary?: string
  offerUrl: string
}): string {
  return `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Inter, Arial, sans-serif; color: #555555; background: #F8FBFF; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0D1B3E; padding: 32px; text-align: center; }
    .header h1 { color: white; font-size: 24px; margin: 0; }
    .body { padding: 40px; }
    .offer-box { background: #F0F7FF; border: 2px solid #1A73E8; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .btn { display: inline-block; background: #1A73E8; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
    .footer { background: #F8FBFF; padding: 24px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Gratulerer! Du har mottatt et jobbtilbud</h1>
    </div>
    <div class="body">
      <p>Kjære ${params.candidateName},</p>
      <p>Vi er glade for å informere deg om at ${params.companyName} ønsker å tilby deg stillingen som <strong>${params.jobTitle}</strong>!</p>
      <div class="offer-box">
        <p><strong>Stilling:</strong> ${params.jobTitle}</p>
        <p><strong>Bedrift:</strong> ${params.companyName}</p>
        <p><strong>Startdato:</strong> ${params.startDate}</p>
        ${params.salary ? `<p><strong>Lønn:</strong> ${params.salary}</p>` : ''}
      </div>
      <p>Klikk nedenfor for å se det fullstendige tilbudet og signere digitalt:</p>
      <a href="${params.offerUrl}" class="btn">Se og signer tilbud</a>
      <p>Gratulerer og velkommen om bord!</p>
    </div>
    <div class="footer">
      <p>Ansora AI-rekrutteringsplattform &bull; <a href="${process.env.NEXT_PUBLIC_APP_URL}">ansora.no</a></p>
    </div>
  </div>
</body>
</html>`
}

export function createAdminNewCompanyEmailHtml(params: {
  companyName: string
  companyEmail: string
  adminUrl: string
}): string {
  return `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Inter, Arial, sans-serif; color: #555555; background: #F8FBFF; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0a0a0a; padding: 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 0; }
    .body { padding: 40px; }
    .info-box { background: #f8f9fa; border-left: 4px solid #ffffff; border-radius: 4px; padding: 16px 20px; margin: 20px 0; }
    .btn { display: inline-block; background: #0a0a0a; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
    .footer { background: #F8FBFF; padding: 24px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ansora Admin</h1>
    </div>
    <div class="body">
      <p>En ny bedrift har registrert seg og venter på godkjenning:</p>
      <div class="info-box">
        <p style="margin:0"><strong>Navn:</strong> ${params.companyName}</p>
        <p style="margin:8px 0 0"><strong>E-post:</strong> ${params.companyEmail}</p>
      </div>
      <p>Logg inn på admin-panelet for å godkjenne eller avvise kontoen:</p>
      <a href="${params.adminUrl}" class="btn">Gå til admin-panel</a>
    </div>
    <div class="footer">
      <p>Ansora AI-rekrutteringsplattform</p>
    </div>
  </div>
</body>
</html>`
}

export function createOnboardingEmailHtml(params: {
  candidateName: string
  jobTitle: string
  companyName: string
  startDate: string
  emailBody: string
}): string {
  return `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Inter, Arial, sans-serif; color: #555555; background: #F8FBFF; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1A73E8, #0D1B3E); padding: 32px; text-align: center; }
    .header h1 { color: white; font-size: 28px; margin: 0; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
    .body { padding: 40px; }
    .steps { background: #F0F7FF; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .footer { background: #F8FBFF; padding: 24px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Velkommen til teamet!</h1>
      <p>${params.companyName}</p>
    </div>
    <div class="body">
      <p>${params.emailBody.replace(/\n/g, '<br>')}</p>
      <div class="steps">
        <h3>Neste steg:</h3>
        <p>✓ Du vil motta mer informasjon fra din leder</p>
        <p>✓ Husk å ta med legitimasjon på første arbeidsdag</p>
        <p>✓ Kontakt oss om du har spørsmål</p>
      </div>
      <p>Vi gleder oss til å se deg!</p>
    </div>
    <div class="footer">
      <p>Ansora AI-rekrutteringsplattform &bull; <a href="${process.env.NEXT_PUBLIC_APP_URL}">ansora.no</a></p>
    </div>
  </div>
</body>
</html>`
}
