import { expressjwt } from "express-jwt";
import { Config } from "../config/config";
import { Request } from "express";

export default expressjwt({

    secret:Config.refresh_secret_key!,
    algorithms:['HS256'],

    getToken(req:Request){

        type AuthCookies={
            accessToken: string,
            refreshToken: string
        }

        const { refreshToken } = req.cookies as AuthCookies;
        return refreshToken;

    },
});