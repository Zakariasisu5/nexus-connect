import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: NewsletterRequest = await req.json();

    // Validate email
    if (!email || !email.includes("@")) {
      console.log("Invalid email provided:", email);
      return new Response(
        JSON.stringify({ error: "Please provide a valid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("newsletter_subscriptions")
      .select("id, confirmed")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      console.log("Email already subscribed:", email);
      return new Response(
        JSON.stringify({ message: "You're already subscribed to our newsletter!" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Insert subscription
    const { error: insertError } = await supabase
      .from("newsletter_subscriptions")
      .insert({ email: email.toLowerCase().trim(), confirmed: true });

    if (insertError) {
      console.error("Error inserting subscription:", insertError);
      throw new Error("Failed to save subscription");
    }

    console.log("New subscription added:", email);

    // Send confirmation email
    const emailResponse = await resend.emails.send({
      from: "MeetMate <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to MeetMate Newsletter! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Welcome to MeetMate!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">You're now part of our community</p>
            </div>
            <div style="background: white; border-radius: 0 0 16px 16px; padding: 40px 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Thank you for subscribing to the MeetMate newsletter! You'll be the first to know about:
              </p>
              <ul style="color: #374151; font-size: 15px; line-height: 1.8; padding-left: 20px; margin: 0 0 25px;">
                <li>New features and updates</li>
                <li>Event management tips and best practices</li>
                <li>Industry insights and trends</li>
                <li>Exclusive offers and early access</li>
              </ul>
              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0;">
                If you didn't subscribe to this newsletter, you can safely ignore this email.
              </p>
            </div>
            <div style="text-align: center; padding: 30px 20px;">
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} MeetMate. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Confirmation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Successfully subscribed! Check your email for confirmation." 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in newsletter-subscribe function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to subscribe" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
