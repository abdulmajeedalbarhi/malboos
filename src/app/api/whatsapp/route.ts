import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, message } = body;

        if (!phone || !message) {
            return NextResponse.json({ error: 'Missing phone or message' }, { status: 400 });
        }

        const apiUrl = process.env.WHATSAPP_API_URL;
        const apiToken = process.env.WHATSAPP_API_TOKEN;

        // If no API configured, simulate success for development/testing
        if (!apiUrl || !apiToken) {
            console.warn('WhatsApp API not configured. Simulating success.', { phone, message });
            return NextResponse.json({ success: true, simulated: true });
        }

        // Setup for UltraMsg API format
        const formData = new URLSearchParams();
        formData.append('token', apiToken);
        formData.append('to', phone.replace(/\D/g, '')); // ensure numbers only
        formData.append('body', message);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('WhatsApp API Error:', errorText);
            return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error('Error in WhatsApp API route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
