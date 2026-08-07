exports.id=7806,exports.ids=[7806],exports.modules={30787:(a,b,c)=>{"use strict";Object.defineProperty(b,"__esModule",{value:!0}),Object.defineProperty(b,"createDedupedByCallsiteServerErrorLoggerDev",{enumerable:!0,get:function(){return i}});let d=function(a,b){if(a&&a.__esModule)return a;if(null===a||"object"!=typeof a&&"function"!=typeof a)return{default:a};var c=e(b);if(c&&c.has(a))return c.get(a);var d={__proto__:null},f=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var g in a)if("default"!==g&&Object.prototype.hasOwnProperty.call(a,g)){var h=f?Object.getOwnPropertyDescriptor(a,g):null;h&&(h.get||h.set)?Object.defineProperty(d,g,h):d[g]=a[g]}return d.default=a,c&&c.set(a,d),d}(c(74515));function e(a){if("function"!=typeof WeakMap)return null;var b=new WeakMap,c=new WeakMap;return(e=function(a){return a?c:b})(a)}let f={current:null},g="function"==typeof d.cache?d.cache:a=>a,h=console.warn;function i(a){return function(...b){h(a(...b))}}g(a=>{try{h(f.current)}finally{f.current=null}})},53756:(a,b,c)=>{"use strict";c.d(b,{R:()=>h,f:()=>i});var d=c(55511),e=c.n(d);function f(a,b){return e().createHmac("sha256",a).update(b,"utf8").digest()}function g(a){return e().createHash("sha256").update(a).digest("hex")}async function h({accountId:a,bucket:b,accessKeyId:c,secretAccessKey:d,key:e,body:h,contentType:i}){let j=`${a}.r2.cloudflarestorage.com`,k=e.split("/").map(a=>encodeURIComponent(a)).join("/"),l=`/${b}/${k}`,m=`https://${j}${l}`,n=new Date().toISOString().replace(/[:-]|\.\d{3}/g,""),o=n.substring(0,8),p="auto",q=g(h),r=i.toLowerCase(),s=`content-type:${r}
host:${j}
x-amz-content-sha256:${q}
x-amz-date:${n}
`,t="content-type;host;x-amz-content-sha256;x-amz-date",u=`PUT
${l}

${s}
${t}
${q}`,v=`${o}/${p}/s3/aws4_request`,w=`AWS4-HMAC-SHA256
${n}
${v}
${g(u)}`,x=f(`AWS4${d}`,o),y=f(x,p),z=f(y,"s3"),A=f(z,"aws4_request"),B=f(A,w).toString("hex"),C=`AWS4-HMAC-SHA256 Credential=${c}/${v}, SignedHeaders=${t}, Signature=${B}`,D=await fetch(m,{method:"PUT",headers:{"Content-Type":i,Host:j,"x-amz-date":n,"x-amz-content-sha256":q,Authorization:C},body:h});if(!D.ok){let a=await D.text().catch(()=>"");throw Error(`Cloudflare R2 upload failed (${D.status} ${D.statusText}): ${a}`)}}async function i({accountId:a,bucket:b,accessKeyId:c,secretAccessKey:d,key:e}){let h=`${a}.r2.cloudflarestorage.com`,i=e.split("/").map(a=>encodeURIComponent(a)).join("/"),j=`/${b}/${i}`,k=`https://${h}${j}`,l=new Date().toISOString().replace(/[:-]|\.\d{3}/g,""),m=l.substring(0,8),n="auto",o=g(""),p=`host:${h}
x-amz-content-sha256:${o}
x-amz-date:${l}
`,q="host;x-amz-content-sha256;x-amz-date",r=`DELETE
${j}

${p}
${q}
${o}`,s=`${m}/${n}/s3/aws4_request`,t=`AWS4-HMAC-SHA256
${l}
${s}
${g(r)}`,u=f(`AWS4${d}`,m),v=f(u,n),w=f(v,"s3"),x=f(w,"aws4_request"),y=f(x,t).toString("hex"),z=`AWS4-HMAC-SHA256 Credential=${c}/${s}, SignedHeaders=${q}, Signature=${y}`,A=await fetch(k,{method:"DELETE",headers:{Host:h,"x-amz-date":l,"x-amz-content-sha256":o,Authorization:z}});if(!A.ok&&404!==A.status){let a=await A.text().catch(()=>"");throw Error(`Cloudflare R2 delete failed (${A.status} ${A.statusText}): ${a}`)}}},62332:(a,b,c)=>{"use strict";c.d(b,{j:()=>t});var d=c(79341),e=c(14369),f=c(44919),g=c(97945),h=c(64168),i=c(87026),j=c(533),k=c(95344),l=c(76586),m=c(85685);let n={...m.KW},o=(0,l.a)(n),p=o.newRole({...m.vC.statements}),q=o.newRole({...m.MH.statements}),r=o.newRole({...m.U1.statements});var s=c(30314);let t=(0,f.l)({secret:process.env.BETTER_AUTH_SECRET||"fallback_secret_for_build_only",baseURL:process.env.BETTER_AUTH_URL||"https://rathagala.lk",database:(0,d.y)(e.db,{provider:"pg",schema:{user:s.users,session:s.sessions,account:s.accounts,verification:s.verifications,twoFactor:s.twoFactors,organization:s.organizations,member:s.members,invitation:s.invitations}}),emailAndPassword:{enabled:!0,requireEmailVerification:!0,sendVerificationEmail:async({user:a,url:b})=>{console.log("Email verification required for:",a.email)},async sendResetPassword({user:a,url:b}){try{let{getTransporter:d}=await c.e(1462).then(c.bind(c,41462));await d().sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a.email,subject:"Reset Your Password - Rathagala",html:`
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                  .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                  .button { display: inline-block; padding: 12px 30px; background-color: #024950; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Password Reset Request</h1>
                  </div>
                  <div class="content">
                    <p>Hello ${a.name||"there"},</p>
                    <p>We received a request to reset your password for your Rathagala account.</p>
                    <p>Click the button below to reset your password:</p>
                    <p style="text-align: center;">
                      <a href="${b}" class="button">Reset Password</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #024950;">${b}</p>
                    <p><strong>This link will expire in 1 hour.</strong></p>
                    <p>If you didn't request a password reset, you can safely ignore this email.</p>
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
Hello ${a.name||"there"},

We received a request to reset your password for your Rathagala account.

Click the link below to reset your password:
${b}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

Best regards,
The Rathagala Team

\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.
If you have any questions, contact us at support@rathagala.lk
          `}),console.log("Password reset email sent successfully to:",a.email)}catch(a){throw console.error("Failed to send password reset email:",a),a}}},plugins:[(0,g.AI)(),(0,h.w)(),(0,i.h)(),(0,j.C)(),(0,k.k)({ac:o,roles:{member:p,admin:q,owner:r},allowUserToCreateOrganization:a=>!!a,async sendInvitationEmail(a){let b=`https://rathagala.lk/accept-invitation/${a.id}`;try{let{getTransporter:d}=await c.e(1462).then(c.bind(c,41462));await d().sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a.email,subject:"Organization Invitation - Rathagala",html:`
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #024950; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .button { display: inline-block; padding: 12px 30px; background-color: #024950; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>Organization Invitation</h1>
                    </div>
                    <div class="content">
                      <p>Hello,</p>
                      <p>You have been invited to join an organization on Rathagala.</p>
                      <p>Click the button below to accept the invitation:</p>
                      <p style="text-align: center;">
                        <a href="${b}" class="button">Accept Invitation</a>
                      </p>
                      <p>Or copy and paste this link into your browser:</p>
                      <p style="word-break: break-all; color: #024950;">${b}</p>
                      <p>Best regards,<br>The Rathagala Team</p>
                    </div>
                    <div class="footer">
                      <p>\xa9 ${new Date().getFullYear()} Rathagala. All rights reserved.</p>
                      <p>If you have any questions, contact us at support@rathagala.lk</p>
                    </div>
                  </div>
                </body>
              </html>
            `}),console.log("Organization invitation email sent successfully to:",a.email)}catch(a){console.error("Failed to send organization invitation email:",a)}}})],user:{additionalFields:{role:{type:"string",defaultValue:"user",required:!1},phone:{type:"string",required:!1},whatsappNumber:{type:"string",required:!1},province:{type:"string",required:!1},district:{type:"string",required:!1},city:{type:"string",required:!1},location:{type:"string",required:!1},isOrganization:{type:"boolean",defaultValue:!1,required:!1}}}})},67080:(a,b,c)=>{"use strict";c.d(b,{tF:()=>l});var d=c(91043);let e=a=>encodeURIComponent(a).replace(/[!'()*]/g,f),f=a=>`%${a.charCodeAt(0).toString(16).toUpperCase()}`;class g{statusCode;reason;headers;body;constructor(a){this.statusCode=a.statusCode,this.reason=a.reason,this.headers=a.headers||{},this.body=a.body}static isInstance(a){return!!a&&"number"==typeof a.statusCode&&"object"==typeof a.headers}}function h(a,b){return new Request(a,b)}let i={supported:void 0};class j{config;configProvider;static create(a){return"function"==typeof a?.handle?a:new j(a)}constructor(a){"function"==typeof a?this.configProvider=a().then(a=>a||{}):(this.config=a??{},this.configProvider=Promise.resolve(this.config)),void 0===i.supported&&(i.supported=!!("undefined"!=typeof Request&&"keepalive"in h("https://[::1]")))}destroy(){}async handle(a,{abortSignal:b,requestTimeout:c}={}){this.config||(this.config=await this.configProvider);let d=c??this.config.requestTimeout,f=!0===this.config.keepAlive,j=this.config.credentials;if(b?.aborted)return Promise.reject(k(b));let l=a.path,m=function(a){let b=[];for(let c of Object.keys(a).sort()){let d=a[c];if(c=e(c),Array.isArray(d))for(let a=0,f=d.length;a<f;a++)b.push(`${c}=${e(d[a])}`);else{let a=c;(d||"string"==typeof d)&&(a+=`=${e(d)}`),b.push(a)}}return b.join("&")}(a.query||{});m&&(l+=`?${m}`),a.fragment&&(l+=`#${a.fragment}`);let n="";if(null!=a.username||null!=a.password){let b=a.username??"",c=a.password??"";n=`${b}:${c}@`}let{port:o,method:p}=a,q=`${a.protocol}//${n}${a.hostname}${o?`:${o}`:""}${l}`,r="GET"===p||"HEAD"===p?void 0:a.body,s={body:r,headers:new Headers(a.headers),method:p,credentials:j};this.config?.cache&&(s.cache=this.config.cache),r&&(s.duplex="half"),"undefined"!=typeof AbortController&&(s.signal=b),i.supported&&(s.keepalive=f),"function"==typeof this.config.requestInit&&Object.assign(s,this.config.requestInit(a));let t=()=>{},u=[fetch(h(q,s)).then(a=>{let b=a.headers,c={};for(let a of b.entries())c[a[0]]=a[1];return void 0==a.body?a.blob().then(b=>({response:new g({headers:c,reason:a.statusText,statusCode:a.status,body:b})})):{response:new g({headers:c,reason:a.statusText,statusCode:a.status,body:a.body})}}),function(a=0){return new Promise((b,c)=>{a&&setTimeout(()=>{let b=Error(`Request did not complete within ${a} ms`);b.name="TimeoutError",c(b)},a)})}(d)];return b&&u.push(new Promise((a,c)=>{let d=()=>{c(k(b))};"function"==typeof b.addEventListener?(b.addEventListener("abort",d,{once:!0}),t=()=>b.removeEventListener("abort",d)):b.onabort=d})),Promise.race(u).finally(t)}updateHttpClientConfig(a,b){this.config=void 0,this.configProvider=this.configProvider.then(c=>(c[a]=b,c))}httpHandlerConfigs(){return this.config??{}}}function k(a){let b=a&&"object"==typeof a&&"reason"in a?a.reason:void 0;if(b){if(b instanceof Error){let a=Error("Request aborted");return a.name="AbortError",a.cause=b,a}let a=Error(String(b));return a.name="AbortError",a}let c=Error("Request aborted");return c.name="AbortError",c}function l(){let a=process.env.R2_BUCKET_NAME||process.env.NEXT_PUBLIC_R2_BUCKET_NAME||process.env.AWS_S3_BUCKET||"",b=process.env.R2_ACCOUNT_ID||process.env.NEXT_PUBLIC_R2_ACCOUNT_ID||"",c=process.env.R2_ACCESS_KEY_ID||process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID||process.env.AWS_ACCESS_KEY_ID||"",d=process.env.R2_SECRET_ACCESS_KEY||process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY||process.env.AWS_SECRET_ACCESS_KEY||"",e=process.env.R2_CUSTOM_DOMAIN||"",f=process.env.R2_PUBLIC_URL||process.env.NEXT_PUBLIC_R2_PUBLIC_URL||"";return{region:"auto",bucket:a,accountId:b,accessKeyId:c,secretAccessKey:d,baseUrl:e?`https://${e}`:f}}new Proxy({},{get:(a,b)=>l()[b]}),new Proxy({},{get(a,b){let c=function(){let a=l();if(!a.accountId||!a.accessKeyId||!a.secretAccessKey)throw Error(`Cloudflare R2 storage credentials missing or unconfigured: accountId=${!!a.accountId}, accessKeyId=${!!a.accessKeyId}, secretAccessKey=${!!a.secretAccessKey}`);return new d.S3Client({region:a.region,endpoint:`https://${a.accountId}.r2.cloudflarestorage.com`,requestHandler:new j,credentials:{accessKeyId:a.accessKeyId,secretAccessKey:a.secretAccessKey}})}(),e=c[b];return"function"==typeof e?e.bind(c):e}})},78335:()=>{},96487:()=>{}};