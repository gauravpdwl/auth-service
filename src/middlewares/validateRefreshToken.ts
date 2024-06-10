import { expressjwt } from "express-jwt";
import { Config } from "../config/config";
import { Request } from "express";
import { AppDataSource } from "../config/data-source";
import { RefreshToken } from "../entity/RefreshToken";
import logger from "../config/logger";

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

    async isRevoked(req:Request, token){

        console.log('token', token);

        interface IRefreshTokenPayload{
            id:string
        }

        try{
            const refreshTokenRepo=AppDataSource.getRepository(RefreshToken);
            const refreshToken=await refreshTokenRepo.findOne({
                where:{
                    id: Number((token?.payload as IRefreshTokenPayload).id),
                    user:{id: Number(token?.payload.sub)}
                }
            })

            console.log("refreshToken from DB -", refreshToken);

            return refreshToken === null;
        }catch(err){
            logger.error(`Error while getting the refresh token, id: ${(token?.payload as IRefreshTokenPayload).id}`)
        }

        return true;
    }
})