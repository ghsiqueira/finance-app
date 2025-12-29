import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  name: string;
}

// Função para obter configurações com logs de debug
function getGmailConfig(): EmailConfig {
  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'Finance App <noreply@financeapp.com>',
    name: 'Gmail'
  };
  
  console.log('📋 Gmail Config:');
  console.log('  Host:', config.host);
  console.log('  Port:', config.port);
  console.log('  User:', config.user ? '✅ Configurado' : '❌ Vazio');
  console.log('  Pass:', config.pass ? '✅ Configurado' : '❌ Vazio');
  
  return config;
}

function getMailgunConfig(): EmailConfig {
  const config = {
    host: process.env.MAILGUN_HOST || 'smtp.mailgun.org',
    port: Number(process.env.MAILGUN_PORT) || 587,
    user: process.env.MAILGUN_USER || '',
    pass: process.env.MAILGUN_PASS || '',
    from: process.env.MAILGUN_FROM || 'Finance App <noreply@financeapp.com>',
    name: 'Mailgun'
  };
  
  console.log('📋 Mailgun Config:');
  console.log('  Host:', config.host);
  console.log('  Port:', config.port);
  console.log('  User:', config.user ? '✅ Configurado' : '❌ Vazio');
  console.log('  Pass:', config.pass ? '✅ Configurado' : '❌ Vazio');
  
  return config;
}

async function sendWithConfig(
  config: EmailConfig, 
  to: string, 
  subject: string, 
  text: string
): Promise<void> {
  // Verificar se as credenciais existem
  if (!config.user || !config.pass) {
    throw new Error(`Missing credentials for ${config.name}`);
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: false,
    auth: {
      user: config.user,
      pass: config.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  await transporter.sendMail({
    from: config.from,
    to,
    subject,
    text
  });
}

export const sendEmail = async (
  to: string, 
  subject: string, 
  text: string
): Promise<void> => {
  const gmailConfig = getGmailConfig();
  const mailgunConfig = getMailgunConfig();
  
  // Tentar Gmail primeiro
  try {
    console.log(`📧 Tentando enviar email via ${gmailConfig.name}...`);
    await sendWithConfig(gmailConfig, to, subject, text);
    console.log(`✅ Email enviado via ${gmailConfig.name} para ${to}`);
    return;
  } catch (gmailError: any) {
    console.error(`❌ Falha no ${gmailConfig.name}:`, gmailError.message);
    
    // Verificar se é erro de limite ou conexão
    const isLimitError = gmailError.message?.includes('Daily') || 
                        gmailError.message?.includes('limit') ||
                        gmailError.code === 'EENVELOPE';
    
    if (isLimitError) {
      console.log(`⚠️  Limite do ${gmailConfig.name} excedido, tentando ${mailgunConfig.name}...`);
    } else {
      console.log(`⚠️  ${gmailConfig.name} indisponível, tentando ${mailgunConfig.name}...`);
    }
  }

  // Fallback para Mailgun
  try {
    console.log(`📧 Tentando enviar email via ${mailgunConfig.name}...`);
    await sendWithConfig(mailgunConfig, to, subject, text);
    console.log(`✅ Email enviado via ${mailgunConfig.name} (backup) para ${to}`);
    return;
  } catch (mailgunError: any) {
    console.error(`❌ Falha no ${mailgunConfig.name}:`, mailgunError.message);
    throw new Error(
      `Falha ao enviar email. Gmail: indisponível. Mailgun: ${mailgunError.message}`
    );
  }
};

// Função auxiliar para verificar configuração
export const checkEmailConfig = (): { gmail: boolean; mailgun: boolean } => {
  const gmailConfig = getGmailConfig();
  const mailgunConfig = getMailgunConfig();
  
  return {
    gmail: !!(gmailConfig.user && gmailConfig.pass),
    mailgun: !!(mailgunConfig.user && mailgunConfig.pass)
  };
};