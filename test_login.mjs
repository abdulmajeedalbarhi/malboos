import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://xixpwebpjyybnhjxruwm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpeHB3ZWJwanl5Ym5oanhydXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxOTYyMjEsImV4cCI6MjA4Nzc3MjIyMX0.rWARWXzhHLJHDwdsVSXIMP-UaqUfvicwrNDpoBXovi8'
);

async function testLogin() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'abdulmajeedalbarhi@gmail.com',
        password: 'Abdul@123',
    });
    console.log('Login result:', error ? 'ERROR: ' + error.message : 'Success! User ID: ' + data.user.id);
}
testLogin();
