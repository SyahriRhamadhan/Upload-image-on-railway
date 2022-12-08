import transaction from "../models/TransactionModel.js";
import product from "../models/ProductModel.js";
import Users from "../models/UserModel.js";
import path from "path";
import fs from "fs";

export const cereateTransaction = async(req, res) => {
    try {
        if(req.user.role == "admin") {
            return res.status(400).json({
                success: false,
                message: "Kamu adalah admin tidak bisa transaksi",
            });
        }else{
            if(req.files === null) return res.status(400).json({msg: "No File Uploaded"});
            const file = req.files.bukti_Pembayaran;
            const fileSize = file.data.length;
            const ext = path.extname(file.name);
            const fileName = file.md5 + ext;
            const url = `${req.protocol}://${req.get("host")}/images/${fileName}`;
            const allowedType = ['.png','.jpg','.jpeg'];

            if(!allowedType.includes(ext.toLowerCase())) return res.status(422).json({msg: "Invalid Images"});
            if(fileSize > 5000000) return res.status(422).json({msg: "Image must be less than 5 MB"});

            file.mv(`./public/images/${fileName}`, async(err)=>{
                if(err) return res.status(500).json({msg: err.message});
                const Transaction = await transaction.create({
                    productId: req.params.id,
                    userId: req.user.userId,
                    bukti_Pembayaran: url,
                    userVisa: req.user.visa,
                    userPassport: req.user.passport,
                    userIzin: req.user.izin,
                    status: "menunggu",
                })
                res.status(201).send({
                    status: 201,
                    message: 'Berhasil Memesan Silahkan menunggu',
                    data: Transaction
                })
            })

        }
    } catch (error) {
        res.status(402).json({
            status: "FAIL",
            message: error.message,
        });
    }
}

export const accept = async(req, res) => {
    if(req.user.role !== "admin") {
        return res.status(400).json({
            success: false,
            message: "Kamu tidak bisa mengakses ini",
        });
    }
   try {
    const check = await transaction.findOne({
        where: {
            id: req.params.id,
        }
    })
    const accept = await check.update({
        status:"Pesanan Diterima",
    })
    res.status(201).send({
        status: 201,
        message: 'Pesanan Diterima!',
        data: accept
    })
   } catch (error) {
    res.status(400).send({
        status: "FAIL",
        message: error.message,
    })
   }
}

export const reject = async(req, res) => {
    if(req.user.role !== "admin") {
        return res.status(400).json({
            success: false,
            message: "Kamu tidak bisa mengakses ini",
        });
    }
    try {
     const check = await transaction.findOne({
         where: {
             id: req.params.id,
         }
     })
     const reject = await check.update({
         status:"Pesanan Ditolak",
     })
     res.status(201).send({
         status: 201,
         message: 'Pesanan Ditolak!',
         data: reject
     })
    } catch (error) {
     res.status(400).send({
         status: "FAIL",
         message: error.message,
     })
    }
 }
 export const checkIn = async (req, res) => {
    try {
        // const check = await transaction.findOne({
        //     where: {
        //         id: req.params.id,
        //     }
        // })
        const sourceWishlist = await transaction.findOne({
            where: {
                userId: req.user.userId,
                id: req.params.id,
            }
        })
        const checkIn = await sourceWishlist.update({
            checkIn: req.body.checkIn,
        })
        res.status(201).send({
            status: 201,
            message: 'Berhasil check in',
            data: checkIn
        })
       } catch (error) {
        res.status(400).send({
            status: "FAIL",
            message: error.message,
        })
       }
 }
 export const getTransactions = async (req, res) => {
    if(req.user.role !== "admin") {
        return res.status(400).json({
            success: false,
            message: "Kamu gak bisa mengakses ini",
        });
    }
    try {
        const sourceTransaction = await transaction.findAll({
            include: product
        })
        res.status(201).send({
            status: 201,
            data: sourceTransaction
        })
    } catch (error) {
        res.status(400).send({
            status: "FAIL",
            message: error.message,
        })
    }
}
 export const getTransactionByID = async (req, res) => {
    try {
        const sourceTransaction = await transaction.findOne({
            where: {
                id: req.params.id
            },
            include: product
        })
        res.status(201).send({
            status: 201,
            data: sourceTransaction
        })
    } catch (error) {
        res.status(400).send({
            status: "FAIL",
            message: error.message,
        })
    }
}
export const memberHistory = async (req, res) => {
    try {
        const memberHistory = await transaction.findAll({
            where: {
                userId: req.user.userId,
                status: "Pesanan Diterima",
            },
            include: {
                model: product
            }
        })
        res.status(200).json({
            message: "Success",
            memberHistory,
        });
    } catch (error) {
        res.status(400).send({
            status: "FAIL",
            message: error.message,
        })
    }
}