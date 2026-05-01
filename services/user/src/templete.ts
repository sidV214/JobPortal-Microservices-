export const applicationConfirmationTemplate = (
  jobTitle: string,
  companyName: string
) => {
  return ` 
<!DOCTYPE html> 
<html lang="en"> 
<head> 
    <meta charset="UTF-8"> 
    <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
    <title>Application Confirmation</title> 
    <style> 
        body { 
            margin: 0; 
            padding: 0; 
            font-family: Arial, sans-serif; 
            background-color: #f4f4f4; 
        } 
        .email-wrapper { 
            width: 100%; 
            border-collapse: collapse; 
        } 
        .email-container { 
            width: 600px; 
            border-collapse: collapse; 
            background-color: #ffffff; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            border-radius: 8px; 
            overflow: hidden; 
        } 
        .header { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
            padding: 40px 30px; 
            text-align: center; 
        } 
        .header h1 { 
            margin: 0; 
            color: #ffffff; 
            font-size: 28px; 
            font-weight: 600; 
        } 
        .content { 
            padding: 40px 30px; 
        } 
        .text { 
            margin: 0 0 20px; 
            color: #333333; 
            font-size: 16px; 
            line-height: 1.6; 
        } 
        .highlight-box {
            background-color: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .highlight-box p {
            margin: 5px 0;
            color: #333333;
            font-size: 15px;
        }
        .highlight-box strong {
            color: #059669;
        }
        .text-muted { 
            margin: 0 0 20px; 
            color: #666666; 
            font-size: 14px; 
            line-height: 1.6; 
        } 
        .footer { 
            background-color: #f8f9fa; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e9ecef; 
        } 
        .footer-text { 
            margin: 0 0 10px; 
            color: #999999; 
            font-size: 12px; 
        } 
        .footer-text:last-child { 
            margin: 0; 
        } 
    </style> 
</head> 
<body> 
    <table role="presentation" class="email-wrapper"> 
        <tr> 
            <td align="center" style="padding: 40px 0;"> 
                <table role="presentation" class="email-container"> 
                    <!-- Header --> 
                    <tr> 
                        <td class="header"> 
                            <h1>✅ Application Submitted!</h1> 
                        </td> 
                    </tr> 
                     
                    <!-- Content --> 
                    <tr> 
                        <td class="content"> 
                            <p class="text">Hi there,</p> 
                            <p class="text"> 
                                Your application has been successfully submitted! Here are the details:
                            </p> 
                            
                            <div class="highlight-box">
                                <p><strong>Position:</strong> ${jobTitle}</p>
                                <p><strong>Company:</strong> ${companyName}</p>
                            </div>
                             
                            <p class="text-muted"> 
                                The recruiter will review your application and you'll receive an update once there's a change in your application status.
                            </p> 
                             
                            <p class="text-muted"> 
                                Good luck with your application! 🍀
                            </p> 
                        </td> 
                    </tr> 
                     
                    <!-- Footer --> 
                    <tr> 
                        <td class="footer"> 
                            <p class="footer-text"> 
                                © 2025 JobNexus. All rights reserved. 
                            </p> 
                            <p class="footer-text"> 
                                This is an automated message, please do not reply. 
                            </p> 
                        </td> 
                    </tr> 
                </table> 
            </td> 
        </tr> 
    </table> 
</body> 
</html> 
  `;
};

/*
 * ===========================================================================================
 *                              NOTES — user/src/templete.ts
 * ===========================================================================================
 *
 * PURPOSE: HTML email template for job application confirmation emails.
 * Sent to jobseekers immediately after they apply to a job.
 *
 * FUNCTION: applicationConfirmationTemplate(jobTitle: string, companyName: string)
 * - Takes the job title and company name as parameters
 * - Returns a complete HTML email string with inline CSS
 * - Green-themed design (unlike auth's purple reset template)
 *
 * HTML STRUCTURE:
 * - Header: Green gradient banner with "✅ Application Submitted!" title
 * - Highlight Box: Shows Position and Company name in a green-bordered card
 * - Content: Confirmation message and "Good luck" encouragement
 * - Footer: JobNexus copyright and automated message notice
 *
 * DESIGN DIFFERENCES FROM AUTH TEMPLATE:
 * - Color: Green (#10b981 emerald) vs Purple (#667eea)
 * - Purpose: Confirmation vs Action (no button/link needed)
 * - Data: Dynamic job title + company name vs dynamic reset link
 *
 * DATA FLOW:
 * controllers/user.ts applyForJob() → calls this function → gets HTML string
 * → publishes to Kafka "send-mail" → Utils Service consumer → Gmail SMTP
 *
 * CONNECTIONS:
 * • controllers/user.ts → calls this function with job title and company name
 * • consumer.ts (Utils) → receives the HTML and sends it via nodemailer
 *
 * NOTE: Keep branding synchronized with services/job/src/tempelete.ts (status update emails)
 */
