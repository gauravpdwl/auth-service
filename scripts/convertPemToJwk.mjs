import fs from 'fs';
import rsaPemToJwk from 'rsa-pem-to-jwk';

const publickey=fs.readFileSync("./certs/public.pem");

const jwk=rsaPemToJwk(publickey, {use:"sign"}, "public");

// eslint-disable-next-line no-undef
console.log(JSON.stringify(jwk));