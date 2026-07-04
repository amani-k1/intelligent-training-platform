<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau message — BRN SMART</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; color: #222; }
    .wrapper { max-width: 580px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #1B9B85; padding: 28px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 6px; }
    .body { padding: 32px; }
    .badge { display: inline-block; background: #e8f7f5; color: #1B9B85; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 20px; }
    .field { margin-bottom: 20px; }
    .field label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #888; margin-bottom: 6px; }
    .field .value { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 12px 16px; font-size: 14px; color: #333; line-height: 1.5; }
    .field .value.message-box { white-space: pre-line; min-height: 80px; }
    .reply-note { background: #fff8e1; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-top: 24px; font-size: 13px; color: #92400e; }
    .reply-note strong { display: block; margin-bottom: 4px; }
    .footer { background: #f8f9fa; padding: 20px 32px; text-align: center; border-top: 1px solid #e9ecef; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.6; }
    .footer a { color: #1B9B85; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>BRN SMART</h1>
      <p>Plateforme intelligente de formation</p>
    </div>

    <div class="body">
      <div class="badge">📬 Nouveau message de contact</div>

      <div class="field">
        <label>Nom de l'utilisateur</label>
        <div class="value">{{ $userName }}</div>
      </div>

      <div class="field">
        <label>Email (répondre à)</label>
        <div class="value">
          <a href="mailto:{{ $userEmail }}" style="color:#1B9B85;">{{ $userEmail }}</a>
        </div>
      </div>

      <div class="field">
        <label>Sujet</label>
        <div class="value">{{ $subject }}</div>
      </div>

      <div class="field">
        <label>Message</label>
        <div class="value message-box">{{ $messageBody }}</div>
      </div>

      <div class="reply-note">
        <strong>💡 Pour répondre directement à cet utilisateur :</strong>
        Cliquez sur <strong>"Répondre"</strong> dans votre messagerie — l'email sera envoyé automatiquement à <strong>{{ $userEmail }}</strong>.
      </div>
    </div>

    <div class="footer">
      <p>Ce message a été envoyé depuis le formulaire de contact de <a href="#">BRN SMART</a>.<br>
      Reçu le {{ now()->format('d/m/Y à H:i') }}</p>
    </div>
  </div>
</body>
</html>
