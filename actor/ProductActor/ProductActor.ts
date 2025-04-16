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
    // products/all?asc=false&filter=price&checked=1,2,3
    static async getProducts(req: Request, res: Response) { x
        try {
            let {asc, filter, checked} = req.query
            if (checked && filter && asc) {
                checked = checked.toString().split(',') // "1,2,3" -> [2]
                let bool_asc = "true" === asc.toString() // "false" -> boolean
               
                const products = await Pool.conn.product.findMany({
                    where: {
                        OR: [
                            checked.map(i => ({type: parseInt(i.toString())})) 
                        ]
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
}