(()=>{var a={};a.id=2110,a.ids=[2110],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},14985:a=>{"use strict";a.exports=require("dns")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},21820:a=>{"use strict";a.exports=require("os")},27910:a=>{"use strict";a.exports=require("stream")},28354:a=>{"use strict";a.exports=require("util")},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},30787:(a,b,c)=>{"use strict";Object.defineProperty(b,"__esModule",{value:!0}),Object.defineProperty(b,"createDedupedByCallsiteServerErrorLoggerDev",{enumerable:!0,get:function(){return i}});let d=function(a,b){if(a&&a.__esModule)return a;if(null===a||"object"!=typeof a&&"function"!=typeof a)return{default:a};var c=e(b);if(c&&c.has(a))return c.get(a);var d={__proto__:null},f=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var g in a)if("default"!==g&&Object.prototype.hasOwnProperty.call(a,g)){var h=f?Object.getOwnPropertyDescriptor(a,g):null;h&&(h.get||h.set)?Object.defineProperty(d,g,h):d[g]=a[g]}return d.default=a,c&&c.set(a,d),d}(c(74515));function e(a){if("function"!=typeof WeakMap)return null;var b=new WeakMap,c=new WeakMap;return(e=function(a){return a?c:b})(a)}let f={current:null},g="function"==typeof d.cache?d.cache:a=>a,h=console.warn;function i(a){return function(...b){h(a(...b))}}g(a=>{try{h(f.current)}finally{f.current=null}})},33873:a=>{"use strict";a.exports=require("path")},34631:a=>{"use strict";a.exports=require("tls")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:a=>{"use strict";a.exports=require("node:os")},51455:a=>{"use strict";a.exports=require("node:fs/promises")},55511:a=>{"use strict";a.exports=require("crypto")},55591:a=>{"use strict";a.exports=require("https")},62332:(a,b,c)=>{"use strict";c.d(b,{j:()=>v});var d=c(79341),e=c(14369),f=c(44919),g=c(97945),h=c(64168),i=c(87026),j=c(533),k=c(95344),l=c(76586),m=c(85685);let n={...m.KW},o=(0,l.a)(n),p=o.newRole({...m.vC.statements}),q=o.newRole({...m.MH.statements}),r=o.newRole({...m.U1.statements});var s=c(52731),t=c(30314);let u=s.createTransport({host:process.env.SMTP_HOST||"smtp.titan.email",port:parseInt(process.env.SMTP_PORT||"587"),secure:!1,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}}),v=(0,f.l)({database:(0,d.y)(e.db,{provider:"pg",schema:{user:t.users,session:t.sessions,account:t.accounts,verification:t.verifications,twoFactor:t.twoFactors,organization:t.organizations,member:t.members,invitation:t.invitations}}),emailAndPassword:{enabled:!0,requireEmailVerification:!0,sendVerificationEmail:async({user:a,url:b})=>{console.log("Email verification required for:",a.email)},async sendResetPassword({user:a,url:b}){try{await u.sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a.email,subject:"Reset Your Password - Rathagala",html:`
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
          `}),console.log("Password reset email sent successfully to:",a.email)}catch(a){throw console.error("Failed to send password reset email:",a),a}}},plugins:[(0,g.AI)(),(0,h.w)(),(0,i.h)(),(0,j.C)(),(0,k.k)({ac:o,roles:{member:p,admin:q,owner:r},allowUserToCreateOrganization:a=>!!a,async sendInvitationEmail(a){let b=`http://localhost:3000/accept-invitation/${a.id}`;try{await u.sendMail({from:`"Rathagala Support" <${process.env.EMAIL_FROM||"support@rathagala.lk"}>`,to:a.email,subject:"Organization Invitation - Rathagala",html:`
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
            `}),console.log("Organization invitation email sent successfully to:",a.email)}catch(a){console.error("Failed to send organization invitation email:",a)}}})],user:{additionalFields:{role:{type:"string",defaultValue:"user",required:!1},phone:{type:"string",required:!1},whatsappNumber:{type:"string",required:!1},province:{type:"string",required:!1},district:{type:"string",required:!1},city:{type:"string",required:!1},location:{type:"string",required:!1},isOrganization:{type:"boolean",defaultValue:!1,required:!1}}}})},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:a=>{"use strict";a.exports=require("node:fs")},74075:a=>{"use strict";a.exports=require("zlib")},76760:a=>{"use strict";a.exports=require("node:path")},77598:a=>{"use strict";a.exports=require("node:crypto")},78335:()=>{},79551:a=>{"use strict";a.exports=require("url")},79646:a=>{"use strict";a.exports=require("child_process")},81630:a=>{"use strict";a.exports=require("http")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},91043:a=>{"use strict";a.exports=require("@aws-sdk/client-s3")},91619:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>K,patchFetch:()=>J,routeModule:()=>F,serverHooks:()=>I,workAsyncStorage:()=>G,workUnitAsyncStorage:()=>H});var d={};c.r(d),c.d(d,{POST:()=>E,dynamic:()=>D});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(51356),u=c(10641),v=c(91043),w=c(62332),x=c(86802),y=c(14369),z=c(30314),A=c(97659),B=c(55511),C=c.n(B);let D="force-dynamic";async function E(a){try{let b=await w.j.api.getSession({headers:await (0,x.headers)()});if(!b||!b.user)return u.NextResponse.json({error:"Unauthorized"},{status:401});let c=await a.formData(),d=c.get("file"),e=c.get("path")||"";if(!d)return u.NextResponse.json({error:"No file provided"},{status:400});let f=Buffer.from(await d.arrayBuffer()),g=d.name,h=function(a){let b=Date.now(),c=C().randomBytes(8).toString("hex"),d=a.split(".")[0],e=a.split(".").pop();return`${d}-${b}-${c}.${e}`}(g),i=e?`${e}/${h}`:h,j=d.type;await A.o.send(new v.PutObjectCommand({Bucket:A.L.bucket,Key:i,Body:f,ContentType:j}));let k=`${A.L.baseUrl}/${i}`,l=j.startsWith("image/")?"IMAGE":j.startsWith("video/")?"VIDEO":j.startsWith("pdf/")?"PDF":"OTHER",[m]=await y.db.insert(z.media).values({url:k,filename:g,type:l,size:d.size,uploaderId:b.user.id}).returning();return u.NextResponse.json(m,{status:201})}catch(a){return console.error("Upload error:",a),u.NextResponse.json({error:a instanceof Error?a.message:"Upload failed"},{status:500})}}let F=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/media/upload/route",pathname:"/api/media/upload",filename:"route",bundlePath:"app/api/media/upload/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"/Users/ud/Malisha/donext/rathagala/src/app/api/media/upload/route.ts",nextConfigOutput:"standalone",userland:d}),{workAsyncStorage:G,workUnitAsyncStorage:H,serverHooks:I}=F;function J(){return(0,g.patchFetch)({workAsyncStorage:G,workUnitAsyncStorage:H})}async function K(a,b,c){var d;let e="/api/media/upload/route";"/index"===e&&(e="/");let g=await F.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:x,prerenderManifest:y,routerServerContext:z,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,resolvedPathname:C}=g,D=(0,j.normalizeAppPath)(e),E=!!(y.dynamicRoutes[D]||y.routes[C]);if(E&&!x){let a=!!y.routes[C],b=y.dynamicRoutes[D];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!E||F.isDev||x||(G="/index"===(G=C)?"/":G);let H=!0===F.isDev||!E,I=E&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:y,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>F.onRequestError(a,b,d,z)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>F.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&A&&B&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!E)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await F.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})},z),b}},l=await F.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:y,isRoutePPREnabled:!1,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,responseGenerator:k,waitUntil:c.waitUntil});if(!E)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",A?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&E||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await F.onRequestError(a,b,{routerKind:"App Router",routePath:D,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})}),E)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},91645:a=>{"use strict";a.exports=require("net")},94735:a=>{"use strict";a.exports=require("events")},96487:()=>{},97659:(a,b,c)=>{"use strict";c.d(b,{L:()=>e,o:()=>f});var d=c(91043);let e={region:"auto",bucket:process.env.R2_BUCKET_NAME||process.env.NEXT_PUBLIC_R2_BUCKET_NAME||process.env.AWS_S3_BUCKET||"",accountId:process.env.R2_ACCOUNT_ID||process.env.NEXT_PUBLIC_R2_ACCOUNT_ID||"",baseUrl:process.env.R2_CUSTOM_DOMAIN?`https://${process.env.R2_CUSTOM_DOMAIN}`:process.env.R2_PUBLIC_URL||process.env.NEXT_PUBLIC_R2_PUBLIC_URL||""},f=new d.S3Client({region:e.region,endpoint:`https://${e.accountId}.r2.cloudflarestorage.com`,credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID||process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID||process.env.AWS_ACCESS_KEY_ID,secretAccessKey:process.env.R2_SECRET_ACCESS_KEY||process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY||process.env.AWS_SECRET_ACCESS_KEY}})}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[5873,2098,3312,6802,1692,4369],()=>b(b.s=91619));module.exports=c})();