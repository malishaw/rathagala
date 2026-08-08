exports.id=3560,exports.ids=[1462,3560],exports.modules={41462:(a,b,c)=>{"use strict";c.d(b,{getTransporter:()=>f});class d{constructor(a){this.config=a}async sendMail(a){let b={from:a.from,to:a.to,subject:a.subject,html:a.html,text:a.text};try{let{sendEmailViaCFSMTP:d}=await c.e(5148).then(c.bind(c,25148));await d(this.config,b),console.log("Email sent via CF SMTP to:",a.to);return}catch(b){let a=b instanceof Error?b.message:String(b);if(!(a.includes("cloudflare:sockets")||a.includes("Cannot find module")||a.includes("MODULE_NOT_FOUND")||a.includes("Cannot resolve module")))throw b;console.log("CF sockets unavailable, falling back to nodemailer")}let d=(await c.e(5112).then(c.t.bind(c,52731,19))).createTransport({host:this.config.host,port:this.config.port,secure:!1,auth:{user:this.config.user,pass:this.config.pass}});await d.sendMail(a),console.log("Email sent via nodemailer to:",a.to)}}let e=null;function f(){return e||(e=new d({host:process.env.SMTP_HOST??"smtp.titan.email",port:parseInt(process.env.SMTP_PORT??"587",10),user:process.env.SMTP_USER??"",pass:process.env.SMTP_PASS??""})),e}},78335:()=>{},82716:(a,b,c)=>{"use strict";c.d(b,{BJ:()=>p,IP:()=>l,J2:()=>f,P8:()=>i,Y$:()=>o,e8:()=>m,ld:()=>h,rH:()=>k,sendAdRejectionEmail:()=>j,u8:()=>q,v4:()=>g,ww:()=>n});var d=c(41462);console.log("SMTP Configuration:",{host:process.env.SMTP_HOST,port:process.env.SMTP_PORT,user:process.env.SMTP_USER,passLength:process.env.SMTP_PASS?.length,passFirstChar:process.env.SMTP_PASS?.[0],passLastChar:process.env.SMTP_PASS?.[process.env.SMTP_PASS.length-1]});let e=(0,d.getTransporter)();async function f({email:a,name:b,code:c}){try{return await e.sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a,subject:"Verify Your Email - Rathagala",html:`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .code-box { background-color: #024950; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 5px; margin: 20px 0; letter-spacing: 8px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Rathagala!</h1>
              </div>
              <div class="content">
                <p>Hello ${b},</p>
                <p>Thank you for signing up! Please use the verification code below to complete your registration.</p>
                <div class="code-box">${c}</div>
                <p><strong>This code will expire in 10 minutes.</strong></p>
                <p>If you didn't create an account, you can safely ignore this email.</p>
                <p>Best regards,<br>The Rathagala Team</p>
              </div>
              <div class="footer">
                <p>\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                <p>If you have any questions, contact us at support@rathagala.lk</p>
              </div>
            </div>
          </body>
        </html>
      `,text:`
Hello ${b},

Thank you for signing up! Please use the verification code below to complete your registration.

Verification Code: ${c}

This code will expire in 10 minutes.

If you didn't create an account, you can safely ignore this email.

Best regards,
The Rathagala Team

\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `}),console.log("Verification code email sent successfully to:",a),{success:!0}}catch(a){throw console.error("Failed to send verification code email:",a),a}}async function g({email:a,name:b}){try{return await e.sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a,subject:"Welcome to Rathagala - Start Posting Ads!",html:`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .feature-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #024950; border-radius: 3px; }
              .button { display: inline-block; padding: 12px 30px; background-color: #024950; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .emoji { font-size: 24px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to Rathagala!</h1>
              </div>
              <div class="content">
                <p>Hello ${b},</p>
                <p><strong>Congratulations!</strong> Your email has been verified successfully. You're all set to start using Rathagala!</p>
                
                <h3 style="color: #024950; margin-top: 30px;">What you can do now:</h3>
                
                <div class="feature-box">
                  <span class="emoji">📝</span>
                  <strong>Post Ads:</strong> Start listing your vehicles and reach thousands of potential buyers.
                </div>
                
                <div class="feature-box">
                  <span class="emoji">🔍</span>
                  <strong>Browse Listings:</strong> Explore a wide range of vehicles available for sale.
                </div>
                
                <div class="feature-box">
                  <span class="emoji">💾</span>
                  <strong>Save Your Favorites:</strong> Keep track of ads you're interested in.
                </div>
                
                <div class="feature-box">
                  <span class="emoji">📊</span>
                  <strong>Manage Your Dashboard:</strong> Track your ads and monitor their performance.
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://rathagala.lk" class="button" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">Start Exploring</a>
                </div>
                
                <p style="margin-top: 30px;">If you have any questions or need assistance, our support team is here to help!</p>
                
                <p>Happy selling and buying!<br><strong>The Rathagala Team</strong></p>
              </div>
              <div class="footer">
                <p>\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                <p>Need help? Contact us at support@rathagala.lk</p>
              </div>
            </div>
          </body>
        </html>
      `,text:`
Welcome to Rathagala!

Hello ${b},

Congratulations! Your email has been verified successfully. You're all set to start using Rathagala!

What you can do now:

📝 Post Ads: Start listing your vehicles and reach thousands of potential buyers.

🔍 Browse Listings: Explore a wide range of vehicles available for sale.

💾 Save Your Favorites: Keep track of ads you're interested in.

📊 Manage Your Dashboard: Track your ads and monitor their performance.

Visit: https://rathagala.lk

If you have any questions or need assistance, our support team is here to help!

Happy selling and buying!
The Rathagala Team

\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.
Need help? Contact us at support@rathagala.lk
      `}),console.log("Welcome email sent successfully to:",a),{success:!0}}catch(a){throw console.error("Failed to send welcome email:",a),a}}async function h({email:a,name:b,adTitle:c}){let d="0766220170",f="0766 220 170",g="94766220170";try{return await e.sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a,subject:"Ad Submitted Successfully - Pending Approval",html:`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .button { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold; font-size: 14px; }
              .whatsapp-btn { background-color: #25D366; color: white; }
              .phone-btn { background-color: #024950; color: white; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Ad Submitted Successfully!</h1>
              </div>
              <div class="content">
                <p>Hello ${b},</p>
                <p>Your ad "<strong>${c}</strong>" has been submitted successfully.</p>
                <p>To publish your ad please send <strong>Your Name</strong> via SMS or WhatsApp through the provided mobile number to <strong>${f}</strong>. The ad will be successfully published after the mobile number verification.</p>
                <p style="text-align: center; margin: 25px 0;">
                  <a href="https://wa.me/${g}" class="button whatsapp-btn" style="display: inline-block; background-color: #25D366; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
                  <a href="tel:${d}" class="button phone-btn" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold; font-size: 14px;">📞 ${f}</a>
                </p>
                <p>Best regards,<br>The Rathagala Team</p>
              </div>
              <div class="footer">
                <p>\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                <p>If you have any questions, contact us at support@rathagala.lk</p>
              </div>
            </div>
          </body>
        </html>
      `,text:`
Hello ${b},

Your ad "${c}" has been submitted successfully.

To publish your ad please send Your Name via SMS or WhatsApp through the provided mobile number to ${f}. The ad will be successfully published after the mobile number verification.

WhatsApp: https://wa.me/${g}
Call: ${d}

Best regards,
The Rathagala Team

\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `}),console.log("Ad posted email sent successfully to:",a),{success:!0}}catch(a){throw console.error("Failed to send ad posted email:",a),a}}async function i({email:a,name:b,adTitle:c,adId:d}){let f="https://rathagala.lk";try{return await e.sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a,subject:"Your Ad has been Approved! - Rathagala",html:`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .success-badge { background-color: #10b981; color: white; font-size: 16px; font-weight: bold; text-align: center; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .ad-title { background-color: #e0f2f1; padding: 15px; border-left: 4px solid #024950; margin: 20px 0; font-size: 18px; font-weight: bold; color: #024950; }
              .cta-button { display: inline-block; background-color: #024950; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold; }
              .link-list { margin: 20px 0; }
              .link-list a { color: #024950; text-decoration: none; font-weight: bold; }
              .link-list a:hover { text-decoration: underline; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Congratulations!</h1>
              </div>
              <div class="content">
                <p>Hello ${b},</p>
                <div class="success-badge">✓ Your Ad Has Been Approved</div>
                <p>Great news! Your ad has been reviewed and approved by our admin team.</p>
                <div class="ad-title">${c}</div>
                <p>Your ad is now live and visible to all users on Rathagala. Potential buyers can now view and contact you about your listing.</p>
                <p style="text-align: center;">
                  <a href="${f}/${d}" class="cta-button" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold;">View Ad</a>
                </p>
                <div class="link-list">
                  <p>📋 <a href="${f}/profile#my-ads" style="color: #024950 !important; text-decoration: none; font-weight: bold;">View My Ads</a></p>
                  <p>🚀 <a href="${f}/profile#my-ads" style="color: #024950 !important; text-decoration: none; font-weight: bold;">Boost Your Ad</a></p>
                  <p>➕ <a href="${f}/sell/new" style="color: #024950 !important; text-decoration: none; font-weight: bold;">Post Another Ad</a></p>
                </div>
                <p>Thank you for using Rathagala!</p>
                <p>Best regards,<br>The Rathagala Team</p>
              </div>
              <div class="footer">
                <p>\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                <p>If you have any questions, contact us at support@rathagala.lk</p>
              </div>
            </div>
          </body>
        </html>
      `,text:`
Hello ${b},

🎉 Congratulations! Your Ad Has Been Approved

Great news! Your ad has been reviewed and approved by our admin team.

Ad Title: ${c}

Your ad is now live and visible to all users on Rathagala. Potential buyers can now view and contact you about your listing.

View Ad: ${f}/${d}
View My Ads: ${f}/profile#my-ads
Boost Your Ad: ${f}/profile#my-ads
Post Another Ad: ${f}/sell/new

Thank you for using Rathagala!

Best regards,
The Rathagala Team

\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `}),console.log("Ad approval email sent successfully to:",a),{success:!0}}catch(a){throw console.error("Failed to send ad approval email:",a),a}}async function j({email:a,name:b,adTitle:c,rejectionReason:d}){try{return await e.sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a,subject:"Your Ad Has Been Rejected - Rathagala",html:`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #dc2626; color: white; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .ad-title { background-color: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; font-size: 18px; font-weight: bold; color: #7f1d1d; }
              .reason-box { background-color: white; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 3px; }
              .reason-label { font-weight: bold; color: #dc2626; margin-bottom: 8px; }
              .cta-button { display: inline-block; background-color: #024950; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Ad Rejection Notice</h2>
              </div>
              <div class="content">
                <p>Hello ${b},</p>
                <p>Unfortunately, your ad has been reviewed and rejected by our admin team.</p>
                <div class="ad-title">${c}</div>
                
                ${d?`
                <div class="reason-box">
                  <div class="reason-label">Reason for Rejection:</div>
                  <p>${d}</p>
                </div>
                `:""}
                
                <p><strong>What You Can Do:</strong></p>
                <ul>
                  <li>Review the rejection reason carefully</li>
                  <li>Make necessary corrections or updates to your ad</li>
                  <li>Resubmit your ad with the improvements</li>
                  <li>Contact our support team if you have questions about the rejection</li>
                </ul>
                
                <p style="text-align: center;">
                  <a href="https://rathagala.lk/profile#my-ads" class="cta-button" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">View My Ads</a>
                </p>
                
                <p>If you believe this rejection was made in error or need further clarification, please contact our support team at support@rathagala.lk</p>
                
                <p>Thank you for your understanding.<br>The Rathagala Team</p>
              </div>
              <div class="footer">
                <p>\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                <p>If you have any questions, contact us at support@rathagala.lk</p>
              </div>
            </div>
          </body>
        </html>
      `,text:`
Hello ${b},

Unfortunately, your ad has been reviewed and rejected by our admin team.

Ad Title: ${c}

${d?`Reason for Rejection:
${d}`:""}

What You Can Do:
- Review the rejection reason carefully
- Make necessary corrections or updates to your ad
- Resubmit your ad with the improvements
- Contact our support team if you have questions about the rejection

If you believe this rejection was made in error or need further clarification, please contact our support team at support@rathagala.lk

Thank you for your understanding.
The Rathagala Team

\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `}),console.log("Ad rejection email sent successfully to:",a),{success:!0}}catch(a){throw console.error("Failed to send ad rejection email:",a),a}}async function k({email:a,name:b}){let c="https://rathagala.lk";try{return await e.sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a,subject:"Your Profile Has Been Updated - Rathagala",html:`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .info-box { background-color: #e0f2f1; padding: 15px; border-left: 4px solid #024950; border-radius: 3px; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 30px; background-color: #024950; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Profile Updated</h1>
              </div>
              <div class="content">
                <p>Hello ${b},</p>
                <p>Your Rathagala profile has been updated successfully.</p>
                <div class="info-box">
                  <p>If you made this change, no further action is needed.</p>
                  <p>If you did <strong>not</strong> make this change, please contact us immediately at <a href="mailto:support@rathagala.lk" style="color: #024950;">support@rathagala.lk</a>.</p>
                </div>
                <p style="text-align: center;">
                  <a href="${c}/profile" class="button" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">View My Profile</a>
                </p>
                <p>Best regards,<br>The Rathagala Team</p>
              </div>
              <div class="footer">
                <p>\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                <p>If you have any questions, contact us at support@rathagala.lk</p>
              </div>
            </div>
          </body>
        </html>
      `,text:`
Hello ${b},

Your Rathagala profile has been updated successfully.

If you made this change, no further action is needed.
If you did NOT make this change, please contact us immediately at support@rathagala.lk.

View your profile: ${c}/profile

Best regards,
The Rathagala Team

\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `}),console.log("Profile updated email sent successfully to:",a),{success:!0}}catch(a){throw console.error("Failed to send profile updated email:",a),a}}async function l({email:a,name:b,missingFields:c}){let d="https://rathagala.lk",f={phone:"Phone Number",whatsappNumber:"WhatsApp Number",province:"Province",district:"District",city:"City",location:"Location",image:"Profile Photo"},g=c.map(a=>`<li>${f[a]||a}</li>`).join(""),h=c.map(a=>`- ${f[a]||a}`).join("\n");try{return await e.sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a,subject:"Complete Your Profile - Rathagala",html:`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .missing-box { background-color: white; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 3px; margin: 20px 0; }
              .missing-box ul { margin: 8px 0 0 0; padding-left: 20px; color: #444; }
              .button { display: inline-block; padding: 12px 30px; background-color: #024950; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Complete Your Profile</h1>
              </div>
              <div class="content">
                <p>Hello ${b},</p>
                <p>A complete profile helps buyers and sellers reach you faster on Rathagala. You still have a few details missing:</p>
                <div class="missing-box">
                  <strong>Missing information:</strong>
                  <ul>${g}</ul>
                </div>
                <p>Completing your profile only takes a minute and improves your experience on the platform.</p>
                <p style="text-align: center;">
                  <a href="${d}/profile" class="button" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">Complete My Profile</a>
                </p>
                <p>Best regards,<br>The Rathagala Team</p>
              </div>
              <div class="footer">
                <p>\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                <p>If you have any questions, contact us at support@rathagala.lk</p>
              </div>
            </div>
          </body>
        </html>
      `,text:`
Hello ${b},

A complete profile helps buyers and sellers reach you faster on Rathagala. You still have a few details missing:

${h}

Completing your profile only takes a minute and improves your experience on the platform.

Complete your profile: ${d}/profile

Best regards,
The Rathagala Team

\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `}),console.log("Profile completion reminder email sent successfully to:",a),{success:!0}}catch(a){throw console.error("Failed to send profile completion reminder email:",a),a}}async function m({email:a,name:b,adTitle:c,adId:d}){let f="https://rathagala.lk";try{return await e.sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a,subject:"Your Listing Expires Tomorrow - Rathagala",html:`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .ad-title { background-color: #fff7ed; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 3px; margin: 20px 0; font-size: 16px; font-weight: bold; color: #92400e; }
              .warning-box { background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ Your Listing Expires Tomorrow</h1>
              </div>
              <div class="content">
                <p>Hello ${b},</p>
                <p>Your listing is expiring in <strong>1 day</strong>:</p>
                <div class="ad-title">${c}</div>
                <div class="warning-box">
                  <p>Listings on Rathagala are active for <strong>60 days</strong>. After expiry, your ad will no longer be visible to buyers.</p>
                </div>
                <p>Renew your listing now to keep it live for another 60 days and continue reaching potential buyers.</p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${f}/profile#my-ads" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">Renew Listing</a>
                  <a href="${f}/${d}" style="display: inline-block; background-color: #f59e0b; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Listing</a>
                </p>
                <p>Best regards,<br>The Rathagala Team</p>
              </div>
              <div class="footer">
                <p>\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                <p>If you have any questions, contact us at support@rathagala.lk</p>
              </div>
            </div>
          </body>
        </html>
      `,text:`
Hello ${b},

Your listing is expiring in 1 day:

"${c}"

Listings on Rathagala are active for 60 days. After expiry, your ad will no longer be visible to buyers.

Renew your listing now to keep it live for another 60 days:
${f}/profile#my-ads

View listing: ${f}/${d}

Best regards,
The Rathagala Team

\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `}),console.log("Listing expiry reminder email sent successfully to:",a),{success:!0}}catch(a){throw console.error("Failed to send listing expiry reminder email:",a),a}}async function n({email:a,name:b,adTitle:c,adId:d,newExpiryDate:f}){let g="https://rathagala.lk",h=f.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});try{return await e.sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a,subject:"Listing Renewed Successfully - Rathagala",html:`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .success-badge { background-color: #10b981; color: white; font-size: 16px; font-weight: bold; text-align: center; padding: 12px; border-radius: 5px; margin: 20px 0; }
              .ad-title { background-color: #e0f2f1; padding: 15px; border-left: 4px solid #024950; border-radius: 3px; margin: 20px 0; font-size: 16px; font-weight: bold; color: #024950; }
              .expiry-box { background-color: white; padding: 15px; border: 1px solid #d1fae5; border-radius: 5px; margin: 20px 0; text-align: center; }
              .expiry-date { font-size: 22px; font-weight: bold; color: #024950; margin-top: 5px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Listing Renewed!</h1>
              </div>
              <div class="content">
                <p>Hello ${b},</p>
                <div class="success-badge">✓ Your listing has been renewed for 60 more days</div>
                <div class="ad-title">${c}</div>
                <div class="expiry-box">
                  <p style="margin: 0; color: #555;">New expiry date</p>
                  <div class="expiry-date">${h}</div>
                </div>
                <p>Your listing is now active and visible to buyers on Rathagala until the date above.</p>
                <p style="text-align: center; margin: 25px 0;">
                  <a href="${g}/${d}" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Listing</a>
                </p>
                <p>Best regards,<br>The Rathagala Team</p>
              </div>
              <div class="footer">
                <p>\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                <p>If you have any questions, contact us at support@rathagala.lk</p>
              </div>
            </div>
          </body>
        </html>
      `,text:`
Hello ${b},

Your listing has been renewed for 60 more days.

"${c}"

New expiry date: ${h}

Your listing is now active and visible to buyers on Rathagala until the date above.

View listing: ${g}/${d}

Best regards,
The Rathagala Team

\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `}),console.log("Listing renewal confirmation email sent successfully to:",a),{success:!0}}catch(a){throw console.error("Failed to send listing renewal confirmation email:",a),a}}async function o({email:a,name:b,adTitle:c,adId:d}){let f="https://rathagala.lk";try{return await e.sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a,subject:"Listing Updated Successfully - Rathagala",html:`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .ad-title { background-color: #e0f2f1; padding: 15px; border-left: 4px solid #024950; border-radius: 3px; margin: 20px 0; font-size: 16px; font-weight: bold; color: #024950; }
              .info-box { background-color: white; padding: 15px; border-left: 4px solid #6b7280; border-radius: 3px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Listing Updated</h1>
              </div>
              <div class="content">
                <p>Hello ${b},</p>
                <p>Your listing has been updated successfully:</p>
                <div class="ad-title">${c}</div>
                <div class="info-box">
                  <p style="margin: 0;">If you did <strong>not</strong> make this change, please contact us immediately at <a href="mailto:support@rathagala.lk" style="color: #024950;">support@rathagala.lk</a>.</p>
                </div>
                <p style="text-align: center; margin: 25px 0;">
                  <a href="${f}/${d}" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Listing</a>
                </p>
                <p>Best regards,<br>The Rathagala Team</p>
              </div>
              <div class="footer">
                <p>\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                <p>If you have any questions, contact us at support@rathagala.lk</p>
              </div>
            </div>
          </body>
        </html>
      `,text:`
Hello ${b},

Your listing has been updated successfully:

"${c}"

If you did NOT make this change, please contact us immediately at support@rathagala.lk.

View listing: ${f}/${d}

Best regards,
The Rathagala Team

\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `}),console.log("Listing updated email sent successfully to:",a),{success:!0}}catch(a){throw console.error("Failed to send listing updated email:",a),a}}async function p({email:a,name:b,adTitle:c,adId:d,boostTypes:f,boostEndAt:g}){let h="https://rathagala.lk",i={BUMP:"Bump Up",TOP_AD:"Top Ad",URGENT:"Urgent Ad",FEATURED:"Featured Ad"},j=g.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}),k=f.map(a=>i[a]||a).join(", "),l=f.map(a=>`<li style="margin: 6px 0;">${i[a]||a}</li>`).join("");try{return await e.sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a,subject:"Your Ad Boost is Now Active! - Rathagala",html:`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .success-badge { background-color: #10b981; color: white; font-size: 16px; font-weight: bold; text-align: center; padding: 12px; border-radius: 5px; margin: 20px 0; }
              .ad-title { background-color: #e0f2f1; padding: 15px; border-left: 4px solid #024950; border-radius: 3px; margin: 20px 0; font-size: 16px; font-weight: bold; color: #024950; }
              .boost-box { background-color: white; padding: 15px; border: 1px solid #d1fae5; border-radius: 5px; margin: 20px 0; }
              .expiry-note { font-size: 13px; color: #555; margin-top: 12px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚡ Your Boost is Live!</h1>
              </div>
              <div class="content">
                <p>Hello ${b},</p>
                <div class="success-badge">✓ Boost Activated</div>
                <p>Great news! Your ad boost has been approved and is now active:</p>
                <div class="ad-title">${c}</div>
                <div class="boost-box">
                  <strong>Active boost features:</strong>
                  <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #444;">
                    ${l}
                  </ul>
                  <p class="expiry-note">Boost active until: <strong>${j}</strong></p>
                </div>
                <p style="text-align: center; margin: 25px 0;">
                  <a href="${h}/${d}" style="display: inline-block; background-color: #024950; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Ad</a>
                </p>
                <p>Best regards,<br>The Rathagala Team</p>
              </div>
              <div class="footer">
                <p>\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                <p>If you have any questions, contact us at support@rathagala.lk</p>
              </div>
            </div>
          </body>
        </html>
      `,text:`
Hello ${b},

Your ad boost has been approved and is now active!

"${c}"

Active boost features: ${k}
Boost active until: ${j}

View your ad: ${h}/${d}

Best regards,
The Rathagala Team

\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
      `}),console.log("Boost approved email sent successfully to:",a),{success:!0}}catch(a){throw console.error("Failed to send boost approved email:",a),a}}function q(){return Math.floor(1e5+9e5*Math.random()).toString()}},96487:()=>{}};