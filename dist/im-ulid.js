!function(){"use strict";var e={};!function(){var r=e;Object.defineProperty(r,"__esModule",{value:!0}),r.imUlid=void 0;var o="0123456789ABCDEFGHJKMNPQRSTVWXYZ";r.imUlid=function(){for(var e,r=Date.now(),t="",n=10;n--;)t=o[e=r%32]+t,r=(r-e)/32;var i=new Uint8Array(15);("crypto"in window?crypto:msCrypto).getRandomValues(i),n=16;for(;n--;)t+=o[31&i[n]];return t}}();var r=exports;for(var o in e)r[o]=e[o];e.__esModule&&Object.defineProperty(r,"__esModule",{value:!0})}();