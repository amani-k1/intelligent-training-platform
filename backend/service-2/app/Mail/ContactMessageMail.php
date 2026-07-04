<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;

class ContactMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $userName,
        public readonly string $userEmail,
        public readonly string $subject,
        public readonly string $messageBody,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[BRN SMART] ' . $this->subject . ' — ' . $this->userName,
            replyTo: [$this->userEmail],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contact_message',
            with: [
                'userName'    => $this->userName,
                'userEmail'   => $this->userEmail,
                'subject'     => $this->subject,
                'messageBody' => $this->messageBody,
            ],
        );
    }

    public function headers(): Headers
    {
        return new Headers(
            text: ['Reply-To' => $this->userEmail],
        );
    }
}
