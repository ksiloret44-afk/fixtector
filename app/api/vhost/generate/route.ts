import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const config = await request.json()

    if (!config.domain || !config.serverType) {
      return NextResponse.json(
        { error: 'Configuration incomplète' },
        { status: 400 }
      )
    }
    
    // Si reverse proxy activé, documentRoot n'est pas requis
    if (!config.useReverseProxy && !config.documentRoot) {
      return NextResponse.json(
        { error: 'Document Root requis si reverse proxy n\'est pas activé' },
        { status: 400 }
      )
    }

    let generatedConfig = ''

    if (config.serverType === 'apache') {
      // Générer la configuration Apache
      generatedConfig = generateApacheConfig(config)
    } else {
      // Générer la configuration Nginx
      generatedConfig = generateNginxConfig(config)
    }

    return NextResponse.json({ config: generatedConfig })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

function generateApacheConfig(config: any): string {
  const serverAliases = config.serverAlias && config.serverAlias.length > 0
    ? `\n    ServerAlias ${config.serverAlias.join(' ')}`
    : ''
  
  const isWindows = process.platform === 'win32'
  const logPath = isWindows ? 'logs' : '${APACHE_LOG_DIR}'
  const docRoot = config.documentRoot || (isWindows ? 'C:/Apache24/htdocs/fixtector' : '/var/www/html')
  const proxyTarget = config.proxyTarget || 'http://localhost:3001'

  let configContent = `<VirtualHost *:${config.port}>
    ServerName ${config.domain}${serverAliases}
    
    # Logs
    ErrorLog "${logPath}/${config.domain}_error.log"
    CustomLog "${logPath}/${config.domain}_access.log" combined
`
  
  // Configuration Reverse Proxy vers Node.js (recommandé pour Next.js)
  if (config.useReverseProxy) {
    configContent += `
    # Reverse Proxy vers Node.js Next.js
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Redirection vers Node.js
    ProxyPass / ${proxyTarget}/
    ProxyPassReverse / ${proxyTarget}/
    
    # WebSocket support (pour HMR et WebSockets)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*) ws://localhost:${proxyTarget.match(/:(\d+)/)?.[1] || '3001'}/$1 [P,L]
    
    # Headers de sécurité
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Compression
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \\.(?:gif|jpe?g|png|ico|zip|gz|bz2|pdf|mp3|mp4|mov|avi|wmv|flv|swf)$ no-gzip dont-vary
    </Location>
`
  } else {
    // Configuration classique avec DocumentRoot
    configContent += `
    DocumentRoot "${docRoot}"
    
    <Directory "${docRoot}">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
`
  }

  // Configuration SSL
  if (config.sslEnabled && config.port === 443) {
    const sslCertPath = config.sslCertPath || (isWindows 
      ? `C:/Apache24/conf/ssl/${config.domain}/fullchain.pem`
      : `/etc/letsencrypt/live/${config.domain}/fullchain.pem`)
    const sslKeyPath = config.sslKeyPath || (isWindows
      ? `C:/Apache24/conf/ssl/${config.domain}/privkey.pem`
      : `/etc/letsencrypt/live/${config.domain}/privkey.pem`)
    
    configContent += `
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile "${sslCertPath}"
    SSLCertificateKeyFile "${sslKeyPath}"
    
    # SSL Protocol (sécurisé)
    SSLProtocol all -SSLv2 -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite HIGH:!aNULL:!MD5:!3DES
    SSLHonorCipherOrder on
    
    # HSTS (HTTP Strict Transport Security)
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
`
    
    // Si reverse proxy, ajouter les mêmes headers de sécurité
    if (config.useReverseProxy) {
      configContent += `
    # Headers de sécurité supplémentaires pour HTTPS
    Header always set Content-Security-Policy "default-src 'self'"
`
    }

    // Redirection HTTP vers HTTPS
    if (config.redirectHttp) {
      configContent += `
    # Redirection HTTP vers HTTPS
    RewriteEngine on
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
`
    }
  }

  // Configuration PHP (seulement si pas de reverse proxy)
  if (!config.useReverseProxy && config.phpVersion) {
    configContent += `
    # PHP Configuration
    <FilesMatch \\.php$>
        SetHandler "proxy:unix:/var/run/php/php${config.phpVersion}-fpm.sock|fcgi://localhost"
    </FilesMatch>
`
  }

  // Configuration personnalisée
  if (config.customConfig) {
    configContent += `
    # Configuration personnalisée
${config.customConfig}
`
  }

  configContent += `</VirtualHost>
`

  // Ajouter la redirection HTTP si SSL est activé
  if (config.sslEnabled && config.redirectHttp) {
    configContent = `<VirtualHost *:80>
    ServerName ${config.domain}${serverAliases}
    Redirect permanent / https://${config.domain}/
</VirtualHost>

${configContent}`
  }

  return configContent
}

function generateNginxConfig(config: any): string {
  const serverAliases = config.serverAlias && config.serverAlias.length > 0
    ? config.serverAlias.map((alias: string) => `    ${alias};`).join('\n')
    : ''

  let configContent = `server {
    listen ${config.port}${config.sslEnabled ? ' ssl http2' : ''};
    server_name ${config.domain}${serverAliases ? '\n' + serverAliases : ''};
    
    root ${config.documentRoot};
    index index.php index.html index.htm;
    
    # Logs
    access_log /var/log/nginx/${config.domain}_access.log;
    error_log /var/log/nginx/${config.domain}_error.log;
`

  // Configuration SSL
  if (config.sslEnabled && config.port === 443) {
    configContent += `
    # SSL Configuration
    ssl_certificate ${config.sslCertPath || '/etc/ssl/certs/ssl-cert-snakeoil.pem'};
    ssl_certificate_key ${config.sslKeyPath || '/etc/ssl/private/ssl-cert-snakeoil.key'};
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
`

    // Redirection HTTP vers HTTPS
    if (config.redirectHttp) {
      configContent = `server {
    listen 80;
    server_name ${config.domain}${serverAliases ? '\n' + serverAliases : ''};
    return 301 https://$server_name$request_uri;
}

${configContent}`
    }
  }

  // Configuration PHP-FPM
  configContent += `
    # PHP-FPM Configuration
    location ~ \\.php$ {
        fastcgi_pass unix:/var/run/php/php${config.phpVersion || '8.1'}-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
    
    # Sécurité
    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Assets statiques
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
`

  // Configuration personnalisée
  if (config.customConfig) {
    configContent += `
    # Configuration personnalisée
${config.customConfig}
`
  }

  configContent += `}
`

  return configContent
}

