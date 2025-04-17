import { Request, Response } from "express";
import { Responder } from "../middleware/Responder";
import { PrismaClient } from "@prisma/client";
import { Pool } from "../middleware/Pool";
import { console } from "inspector";

export class ProductActor {
    static async createProduct(req: Request, res: Response) {
        try {
            const {title, description, price} = req.body
            const product = await Pool.conn.product.create({
                data: {title, description, price}
            })
            res.json(Responder.ok({product}))
        } catch (e) {
            console.log(e)
            res.json(Responder.internal())
        }
    }

    static async getProducts(req: Request, res: Response) { 
        try {
            let {asc, filter, checked} = req.query
            if (checked && filter && asc) {
                let bool_asc = "true" === asc.toString() // "false" -> boolean
                const products = await Pool.conn.product.findMany({
                    where: {
                        type: {
                            some: {
                                id: { in: checked.toString().split(',').map(Number) }
                            }
                        }
                    },
                    orderBy : [
                        filter === "price" ? 
                            {price: bool_asc ? "asc" : "desc"} : 
                            {id: bool_asc ? "asc" : "desc"}
                        ] 
                   
                })
                res.json(Responder.ok({products}))
            } else{
                res.json(Responder.forbidden("Incorrect data"))
            }
            
        } catch (error) {
            console.log(error.message)
            res.json(Responder.internal())
        }
    }
    static async createBasketItem(req: Request, res: Response){
        try {
            const {user_id, product_id, count} = req.body
            const basketItem = await Pool.conn.basketItem.create({
                data: {user_id, product_id, count}
            })
            if (basketItem) {
                res.json(Responder.ok({"message": "The product was added to basket"}))
            } else {
                res.json(Responder.not_found())
            }
            
         } catch (error) {
            console.log(error.message);
            res.json(Responder.internal)
        }
    }
}