(()=>{var a={};a.id=1820,a.ids=[1820],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},14985:a=>{"use strict";a.exports=require("dns")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},21820:a=>{"use strict";a.exports=require("os")},27910:a=>{"use strict";a.exports=require("stream")},28354:a=>{"use strict";a.exports=require("util")},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:a=>{"use strict";a.exports=require("path")},34631:a=>{"use strict";a.exports=require("tls")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:a=>{"use strict";a.exports=require("node:os")},51455:a=>{"use strict";a.exports=require("node:fs/promises")},53756:(a,b,c)=>{"use strict";c.d(b,{If:()=>i,R6:()=>h,fT:()=>j});var d=c(55511);function e(a,b){return d.createHmac("sha256",a).update(b,"utf8").digest()}function f(a){return d.createHash("sha256").update(a).digest("hex")}function g(a){return encodeURIComponent(a).replace(/[!'()*]/g,a=>`%${a.charCodeAt(0).toString(16).toUpperCase()}`)}async function h({accountId:a,bucket:b,accessKeyId:c,secretAccessKey:d,key:h,body:i,contentType:j}){let k=`${a}.r2.cloudflarestorage.com`,l=h.split("/").map(a=>g(a)).join("/"),m=`/${b}/${l}`,n=`https://${k}${m}`,o=new Date().toISOString().replace(/[:-]|\.\d{3}/g,""),p=o.substring(0,8),q="auto",r=f(i),s=j.toLowerCase(),t=`content-type:${s}
host:${k}
x-amz-content-sha256:${r}
x-amz-date:${o}
`,u="content-type;host;x-amz-content-sha256;x-amz-date",v=`PUT
${m}

${t}
${u}
${r}`,w=`${p}/${q}/s3/aws4_request`,x=`AWS4-HMAC-SHA256
${o}
${w}
${f(v)}`,y=e(`AWS4${d}`,p),z=e(y,q),A=e(z,"s3"),B=e(A,"aws4_request"),C=e(B,x).toString("hex"),D=`AWS4-HMAC-SHA256 Credential=${c}/${w}, SignedHeaders=${u}, Signature=${C}`,E=await fetch(n,{method:"PUT",headers:{"Content-Type":j,Host:k,"x-amz-date":o,"x-amz-content-sha256":r,Authorization:D},body:i});if(!E.ok){let a=await E.text().catch(()=>"");throw Error(`Cloudflare R2 upload failed (${E.status} ${E.statusText}): ${a}`)}}async function i({accountId:a,bucket:b,accessKeyId:c,secretAccessKey:d,key:h}){let i=`${a}.r2.cloudflarestorage.com`,j=h.split("/").map(a=>g(a)).join("/"),k=`/${b}/${j}`,l=`https://${i}${k}`,m=new Date().toISOString().replace(/[:-]|\.\d{3}/g,""),n=m.substring(0,8),o="auto",p=f(""),q=`host:${i}
x-amz-content-sha256:${p}
x-amz-date:${m}
`,r="host;x-amz-content-sha256;x-amz-date",s=`GET
${k}

${q}
${r}
${p}`,t=`${n}/${o}/s3/aws4_request`,u=`AWS4-HMAC-SHA256
${m}
${t}
${f(s)}`,v=e(`AWS4${d}`,n),w=e(v,o),x=e(w,"s3"),y=e(x,"aws4_request"),z=e(y,u).toString("hex"),A=`AWS4-HMAC-SHA256 Credential=${c}/${t}, SignedHeaders=${r}, Signature=${z}`,B=await fetch(l,{method:"GET",headers:{Host:i,"x-amz-date":m,"x-amz-content-sha256":p,Authorization:A}});if(!B.ok){let a=await B.text().catch(()=>"");throw Error(`Cloudflare R2 fetch failed (${B.status} ${B.statusText}): ${a}`)}let C=B.headers.get("content-type")||"application/octet-stream",D=B.headers.get("content-length"),E=D?parseInt(D,10):void 0;return{body:B.body||await B.arrayBuffer(),contentType:C,contentLength:E}}async function j({accountId:a,bucket:b,accessKeyId:c,secretAccessKey:d,key:h}){let i=`${a}.r2.cloudflarestorage.com`,j=h.split("/").map(a=>g(a)).join("/"),k=`/${b}/${j}`,l=`https://${i}${k}`,m=new Date().toISOString().replace(/[:-]|\.\d{3}/g,""),n=m.substring(0,8),o="auto",p=f(""),q=`host:${i}
x-amz-content-sha256:${p}
x-amz-date:${m}
`,r="host;x-amz-content-sha256;x-amz-date",s=`DELETE
${k}

${q}
${r}
${p}`,t=`${n}/${o}/s3/aws4_request`,u=`AWS4-HMAC-SHA256
${m}
${t}
${f(s)}`,v=e(`AWS4${d}`,n),w=e(v,o),x=e(w,"s3"),y=e(x,"aws4_request"),z=e(y,u).toString("hex"),A=`AWS4-HMAC-SHA256 Credential=${c}/${t}, SignedHeaders=${r}, Signature=${z}`,B=await fetch(l,{method:"DELETE",headers:{Host:i,"x-amz-date":m,"x-amz-content-sha256":p,Authorization:A}});if(!B.ok&&404!==B.status){let a=await B.text().catch(()=>"");throw Error(`Cloudflare R2 delete failed (${B.status} ${B.statusText}): ${a}`)}}},55511:a=>{"use strict";a.exports=require("crypto")},55591:a=>{"use strict";a.exports=require("https")},62332:(a,b,c)=>{"use strict";c.d(b,{j:()=>t});var d=c(79341),e=c(14369),f=c(44919),g=c(97945),h=c(64168),i=c(87026),j=c(533),k=c(95344),l=c(76586),m=c(85685);let n={...m.KW},o=(0,l.a)(n),p=o.newRole({...m.vC.statements}),q=o.newRole({...m.MH.statements}),r=o.newRole({...m.U1.statements});var s=c(30314);let t=(0,f.l)({secret:process.env.BETTER_AUTH_SECRET||"fallback_secret_for_build_only",baseURL:process.env.BETTER_AUTH_URL||"https://rathagala.lk",database:(0,d.y)(e.db,{provider:"pg",schema:{user:s.users,session:s.sessions,account:s.accounts,verification:s.verifications,twoFactor:s.twoFactors,organization:s.organizations,member:s.members,invitation:s.invitations}}),emailAndPassword:{enabled:!0,requireEmailVerification:!0,sendVerificationEmail:async({user:a,url:b})=>{console.log("Email verification required for:",a.email)},async sendResetPassword({user:a,url:b}){try{let{getTransporter:d}=await c.e(1462).then(c.bind(c,41462));await d().sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a.email,subject:"Reset Your Password - Rathagala",html:`
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
            `}),console.log("Organization invitation email sent successfully to:",a.email)}catch(a){console.error("Failed to send organization invitation email:",a)}}})],user:{additionalFields:{role:{type:"string",defaultValue:"user",required:!1},phone:{type:"string",required:!1},whatsappNumber:{type:"string",required:!1},province:{type:"string",required:!1},district:{type:"string",required:!1},city:{type:"string",required:!1},location:{type:"string",required:!1},isOrganization:{type:"boolean",defaultValue:!1,required:!1}}}})},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},67080:(a,b,c)=>{"use strict";c.d(b,{tF:()=>l});var d=c(91043);let e=a=>encodeURIComponent(a).replace(/[!'()*]/g,f),f=a=>`%${a.charCodeAt(0).toString(16).toUpperCase()}`;class g{statusCode;reason;headers;body;constructor(a){this.statusCode=a.statusCode,this.reason=a.reason,this.headers=a.headers||{},this.body=a.body}static isInstance(a){return!!a&&"number"==typeof a.statusCode&&"object"==typeof a.headers}}function h(a,b){return new Request(a,b)}let i={supported:void 0};class j{config;configProvider;static create(a){return"function"==typeof a?.handle?a:new j(a)}constructor(a){"function"==typeof a?this.configProvider=a().then(a=>a||{}):(this.config=a??{},this.configProvider=Promise.resolve(this.config)),void 0===i.supported&&(i.supported=!!("undefined"!=typeof Request&&"keepalive"in h("https://[::1]")))}destroy(){}async handle(a,{abortSignal:b,requestTimeout:c}={}){this.config||(this.config=await this.configProvider);let d=c??this.config.requestTimeout,f=!0===this.config.keepAlive,j=this.config.credentials;if(b?.aborted)return Promise.reject(k(b));let l=a.path,m=function(a){let b=[];for(let c of Object.keys(a).sort()){let d=a[c];if(c=e(c),Array.isArray(d))for(let a=0,f=d.length;a<f;a++)b.push(`${c}=${e(d[a])}`);else{let a=c;(d||"string"==typeof d)&&(a+=`=${e(d)}`),b.push(a)}}return b.join("&")}(a.query||{});m&&(l+=`?${m}`),a.fragment&&(l+=`#${a.fragment}`);let n="";if(null!=a.username||null!=a.password){let b=a.username??"",c=a.password??"";n=`${b}:${c}@`}let{port:o,method:p}=a,q=`${a.protocol}//${n}${a.hostname}${o?`:${o}`:""}${l}`,r="GET"===p||"HEAD"===p?void 0:a.body,s={body:r,headers:new Headers(a.headers),method:p,credentials:j};this.config?.cache&&(s.cache=this.config.cache),r&&(s.duplex="half"),"undefined"!=typeof AbortController&&(s.signal=b),i.supported&&(s.keepalive=f),"function"==typeof this.config.requestInit&&Object.assign(s,this.config.requestInit(a));let t=()=>{},u=[fetch(h(q,s)).then(a=>{let b=a.headers,c={};for(let a of b.entries())c[a[0]]=a[1];return void 0==a.body?a.blob().then(b=>({response:new g({headers:c,reason:a.statusText,statusCode:a.status,body:b})})):{response:new g({headers:c,reason:a.statusText,statusCode:a.status,body:a.body})}}),function(a=0){return new Promise((b,c)=>{a&&setTimeout(()=>{let b=Error(`Request did not complete within ${a} ms`);b.name="TimeoutError",c(b)},a)})}(d)];return b&&u.push(new Promise((a,c)=>{let d=()=>{c(k(b))};"function"==typeof b.addEventListener?(b.addEventListener("abort",d,{once:!0}),t=()=>b.removeEventListener("abort",d)):b.onabort=d})),Promise.race(u).finally(t)}updateHttpClientConfig(a,b){this.config=void 0,this.configProvider=this.configProvider.then(c=>(c[a]=b,c))}httpHandlerConfigs(){return this.config??{}}}function k(a){let b=a&&"object"==typeof a&&"reason"in a?a.reason:void 0;if(b){if(b instanceof Error){let a=Error("Request aborted");return a.name="AbortError",a.cause=b,a}let a=Error(String(b));return a.name="AbortError",a}let c=Error("Request aborted");return c.name="AbortError",c}function l(){let a=process.env.R2_BUCKET_NAME||process.env.NEXT_PUBLIC_R2_BUCKET_NAME||process.env.AWS_S3_BUCKET||"",b=process.env.R2_ACCOUNT_ID||process.env.NEXT_PUBLIC_R2_ACCOUNT_ID||"",c=process.env.R2_ACCESS_KEY_ID||process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID||process.env.AWS_ACCESS_KEY_ID||"",d=process.env.R2_SECRET_ACCESS_KEY||process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY||process.env.AWS_SECRET_ACCESS_KEY||"",e=process.env.R2_CUSTOM_DOMAIN||"",f=process.env.R2_PUBLIC_URL||process.env.NEXT_PUBLIC_R2_PUBLIC_URL||"",g="";if(f)g=f.replace(/\/$/,"");else if(e){let a=e.replace(/^https?:\/\//,"").replace(/\/$/,"");g=a==="https://rathagala.lk".replace(/^https?:\/\//,"").replace(/\/$/,"")?"/api/media/file":`https://${a}`}else g="/api/media/file";return{region:"auto",bucket:a,accountId:b,accessKeyId:c,secretAccessKey:d,baseUrl:g}}new Proxy({},{get:(a,b)=>l()[b]}),new Proxy({},{get(a,b){let c=function(){let a=l();if(!a.accountId||!a.accessKeyId||!a.secretAccessKey)throw Error(`Cloudflare R2 storage credentials missing or unconfigured: accountId=${!!a.accountId}, accessKeyId=${!!a.accessKeyId}, secretAccessKey=${!!a.secretAccessKey}`);return new d.S3Client({region:a.region,endpoint:`https://${a.accountId}.r2.cloudflarestorage.com`,requestHandler:new j,credentials:{accessKeyId:a.accessKeyId,secretAccessKey:a.secretAccessKey}})}(),e=c[b];return"function"==typeof e?e.bind(c):e}})},73024:a=>{"use strict";a.exports=require("node:fs")},74075:a=>{"use strict";a.exports=require("zlib")},76760:a=>{"use strict";a.exports=require("node:path")},77598:a=>{"use strict";a.exports=require("node:crypto")},78335:()=>{},79551:a=>{"use strict";a.exports=require("url")},79646:a=>{"use strict";a.exports=require("child_process")},81630:a=>{"use strict";a.exports=require("http")},84127:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>F,patchFetch:()=>E,routeModule:()=>A,serverHooks:()=>D,workAsyncStorage:()=>B,workUnitAsyncStorage:()=>C});var d={};c.r(d),c.d(d,{POST:()=>z,dynamic:()=>y});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(51356),u=c(10641),v=c(62332),w=c(67080),x=c(53756);let y="force-dynamic";async function z(a){try{let b=await v.j.api.getSession({headers:a.headers});if(!b||!b.user)return u.NextResponse.json({error:"Unauthorized"},{status:401});let{key:c}=await a.json();if(!c)return u.NextResponse.json({error:"No key provided"},{status:400});let d=(0,w.tF)();if(!d.bucket||!d.accountId||!d.accessKeyId||!d.secretAccessKey)throw Error("Cloudflare R2 credentials missing or unconfigured.");return await (0,x.fT)({accountId:d.accountId,bucket:d.bucket,accessKeyId:d.accessKeyId,secretAccessKey:d.secretAccessKey,key:c}),u.NextResponse.json({success:!0})}catch(a){return console.error("Delete error:",a),u.NextResponse.json({error:a instanceof Error?a.message:"Delete failed"},{status:500})}}let A=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/media/delete/route",pathname:"/api/media/delete",filename:"route",bundlePath:"app/api/media/delete/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"/Users/ud/Malisha/donext/rathagala/src/app/api/media/delete/route.ts",nextConfigOutput:"standalone",userland:d}),{workAsyncStorage:B,workUnitAsyncStorage:C,serverHooks:D}=A;function E(){return(0,g.patchFetch)({workAsyncStorage:B,workUnitAsyncStorage:C})}async function F(a,b,c){var d;let e="/api/media/delete/route";"/index"===e&&(e="/");let g=await A.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:x,prerenderManifest:y,routerServerContext:z,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!(y.dynamicRoutes[E]||y.routes[D]);if(F&&!x){let a=!!y.routes[D],b=y.dynamicRoutes[E];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||A.isDev||x||(G="/index"===(G=D)?"/":G);let H=!0===A.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:y,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>A.onRequestError(a,b,d,z)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>A.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await A.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})},z),b}},l=await A.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:y,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await A.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},91043:a=>{"use strict";a.exports=require("@aws-sdk/client-s3")},91645:a=>{"use strict";a.exports=require("net")},94735:a=>{"use strict";a.exports=require("events")},96487:()=>{}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[5873,197,2098,3918,1692,4369],()=>b(b.s=84127));module.exports=c})();