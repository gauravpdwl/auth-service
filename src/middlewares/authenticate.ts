import {expressjwt, GetVerificationKey} from 'express-jwt';
import JwksClient from 'jwks-rsa';
import { Config } from '../config/config';
import { Request } from 'express';

export default expressjwt({
    secret: JwksClient.expressJwtSecret({
        jwksUri: Config.jwks_uri!,
        cache:true,
        rateLimit:true
    }) as GetVerificationKey,
    algorithms:['RS256'],
    // default fetches from headers 
    getToken(req: Request){
        const authHeader=req.headers.authorization;
        // token in header looks like "Bearer hdfdfodsfdfdh"
        if(authHeader && authHeader.split(' ')[1] !== undefined){
            const token=authHeader.split(' ')[1];
            if(token){
                return token;
            }
        }

        type AuthCookies={
            accessToken: string
        }

        const {accessToken}=req.cookies as AuthCookies;

        // if(!req.cookies){
        //     const error= createHttpError(401, "No Access Token Found")
        //     throw error;
        // }

        return accessToken;

    }
}) 