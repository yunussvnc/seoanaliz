const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface SupportPayload {
  name: string;
  email: string;
  message: string;
  phone?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL');
    const toEmail = Deno.env.get('TO_EMAIL');

    if (!apiKey || !fromEmail || !toEmail) {
      return new Response(JSON.stringify({ success: false, error: 'Mail konfigürasyonu eksik (SENDGRID_API_KEY, FROM_EMAIL, TO_EMAIL)' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      throw new Error('Geçersiz body');
    }

    const payload = body as SupportPayload;
    if (!payload.name || !payload.email || !payload.message) {
      throw new Error('Eksik alan: name, email veya message');
    }

    const emailBody = {
      personalizations: [
        {
          to: [{ email: toEmail }],
          subject: `Yeni destek talebi: ${payload.name}`,
        },
      ],
      from: { email: fromEmail, name: 'Neokreatif Support' },
      reply_to: { email: payload.email, name: payload.name },
      content: [
        {
          type: 'text/html',
          value: `
            <p><strong>İsim:</strong> ${payload.name}</p>
            <p><strong>E-posta:</strong> ${payload.email}</p>
            <p><strong>Telefon:</strong> ${payload.phone ?? '-'} </p>
            <p><strong>Mesaj:</strong></p>
            <p>${payload.message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}</p>
          `,
        },
      ],
    };

    const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.error('SendGrid error', resp.status, text);
      return new Response(JSON.stringify({ success: false, error: 'E-posta gönderilemedi' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('send-support-email error', err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
