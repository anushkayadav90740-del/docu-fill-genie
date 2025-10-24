import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { submissionId } = await req.json();

    if (!submissionId) {
      throw new Error('Submission ID is required');
    }

    console.log('Generating PDF for submission:', submissionId);

    // Fetch submission data
    const { data: submission, error: fetchError } = await supabaseClient
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      throw new Error('Submission not found');
    }

    console.log('Submission data retrieved:', submission.full_name);

    // Generate PDF content (HTML template)
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Arial', sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #3b82f6;
    }
    .header h1 {
      color: #3b82f6;
      margin: 0;
      font-size: 28px;
    }
    .section {
      margin-bottom: 20px;
    }
    .field-label {
      font-weight: bold;
      color: #555;
      margin-bottom: 5px;
    }
    .field-value {
      margin-bottom: 15px;
      padding: 8px;
      background: #f8f9fa;
      border-left: 3px solid #3b82f6;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Matrica Internship Assignment - Document Template</h1>
  </div>

  <div class="section">
    <div class="field-label">Full Name:</div>
    <div class="field-value">${submission.full_name}</div>

    <div class="field-label">Email Address:</div>
    <div class="field-value">${submission.email}</div>

    <div class="field-label">Mobile Number:</div>
    <div class="field-value">${submission.mobile}</div>

    <div class="field-label">Company / Institute Name:</div>
    <div class="field-value">${submission.company}</div>

    <div class="field-label">Department / Role:</div>
    <div class="field-value">${submission.role}</div>

    <div class="field-label">Address:</div>
    <div class="field-value">${submission.address}</div>

    <div class="field-label">City:</div>
    <div class="field-value">${submission.city}</div>

    <div class="field-label">State:</div>
    <div class="field-value">${submission.state}</div>

    <div class="field-label">Pin Code:</div>
    <div class="field-value">${submission.pin_code}</div>

    <div class="field-label">Date of Submission:</div>
    <div class="field-value">${new Date(submission.date_of_submission).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}</div>

    ${submission.remarks ? `
      <div class="field-label">Remarks / Notes:</div>
      <div class="field-value">${submission.remarks}</div>
    ` : ''}
  </div>

  <div class="footer">
    <p>Document generated on ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}</p>
    <p>This is an auto-generated document from the DocuGen system.</p>
  </div>
</body>
</html>
    `;

    console.log('Generating PDF from HTML content');

    // Use a PDF generation API - for this demo, we'll use PDFShift API
    // In production, you would add the PDFSHIFT_API_KEY secret
    const pdfResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa('api:' + (Deno.env.get('PDFSHIFT_API_KEY') || 'demo'))}`,
      },
      body: JSON.stringify({
        source: htmlContent,
        format: 'A4',
        margin: '20px',
      }),
    });

    if (!pdfResponse.ok) {
      console.error('PDF generation failed:', await pdfResponse.text());
      
      // Return HTML as fallback
      return new Response(
        JSON.stringify({
          success: true,
          pdfUrl: `data:text/html;base64,${btoa(htmlContent)}`,
          message: 'PDF preview generated (add PDFSHIFT_API_KEY for actual PDF generation)',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const pdfBlob = await pdfResponse.arrayBuffer();
    console.log('PDF generated successfully');

    // Convert to base64 for data URL
    const base64Pdf = btoa(
      new Uint8Array(pdfBlob).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    const pdfUrl = `data:application/pdf;base64,${base64Pdf}`;

    // Update submission with PDF URL
    await supabaseClient
      .from('submissions')
      .update({ pdf_url: pdfUrl })
      .eq('id', submissionId);

    console.log('PDF URL saved to database');

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: pdfUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
