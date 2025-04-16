import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import path from 'path'
import { Responder } from "../middleware/Responder";
import { PrismaClient } from "@prisma/client";
import { Pool } from "../middleware/Pool";


export class UserActor {
    static async signin(req: Request, res: Response){
        try {
            // 1. get data
            const {login, password} = req.body
            // 2. find User in DB by login
           
            const user = await Pool.conn.user.findFirst({
                where: {login}
            })
            if (!user){
                res.send(Responder.forbidden("Пользователь не найден"))
                return;
            } else {
                // 3. compare passwords
                let pwdCompare = bcrypt.compareSync(password, user.password)
                if (!pwdCompare){
                    res.send(Responder.forbidden("Пароль неверный"))
                    return;
                }
                // 4. token
                const token = jwt.sign(
                    {login: user.login},
                    process.env.SECRET_KEY || "DEFAULT_SECRET_KEY", 
                    {expiresIn: '24h'}
                )
                res.json(Responder.ok({token, user}))
            }
            
        } catch (e) {
            console.log(e.message)
            return res.end(Responder.forbidden("Некорректный запрос"))
        }
     
    }
    static async signup(req: Request, res: Response){
        try {
            // пытаемся что-то выполнить 
             // 1. get data 
            const {login, password, email, phone} = req.body
            
            // 2. validate data
            if (!login || !password || !email || !phone) {
                res.json(Responder.forbidden("Некорректные данные"))
            }
            // 3. check Users on unique (DB)
           
            const candidate = await Pool.conn.user.findFirst({
                where: {
                    OR: [{login}, {email}, {phone}]
                }
            })
            if (candidate) {
                res.send(Responder.forbidden("Введите уникальные данные"))
                return;
            }
            // 4. hash pwd
            const hashPassword = await bcrypt.hash(password, 5)
            // 5. create user (DB)
            const user = await Pool.conn.user.create({
                data: {
                    login, phone, email, password: hashPassword
                }
            })
            // 6. login user
            const token = jwt.sign(
                {login: user.login},
                process.env.SECRET_KEY || "DEFAULT_SECRET_KEY", 
                {expiresIn: '24h'}
            )
            res.json(Responder.ok({token, user}))
        }
        catch (e) {
            // отлов ошибки
            console.log(e.message)
            return res.end(Responder.forbidden("Некорректный запрос"))
        }
       
    }
}


// curl --header "Content-Type: application/json" --request POST  --data '{"login":"xyz","password":"xyz"}' http://localhost:5000/user/signup