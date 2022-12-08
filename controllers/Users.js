import Users from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
// import res from "express/lib/response";

export const getRoot = async(req, res) => {
  res.status(200).json({
    status: "OK",
    message: "FlightGo API is up and running!",
  });
}
export const getUsers = async(req, res) => {
    if(req.user.role !== "admin") {
      return res.status(400).json({
          success: false,
          message: "Kamu gak bisa mengakses ini dengan role member",
      });
    }
  try {
    const users = await Users.findAll({
      attributes:['id','image_user','name','email', 'role','phone','address','visa','passport','izin','createdAt','updatedAt']
    });
    res.json(users);
  } catch (error) {
  console.log(error);
  }
}

export const Register = async(req, res) => {
    const { email,name, password } = req.body;
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);
    try {
        await Users.create({
            name: name,
            email: email,
            password: hashPassword,
            role: "member"
        });
        res.json({msg: "Register Berhasil"});
    } catch (error) {
        console.log(error);
    }
}
 
export const Login = async(req, res) => {
    try {
        const user = await Users.findAll({
            where:{
                email: req.body.email
            }
        });
        const match = await bcrypt.compare(req.body.password, user[0].password);
        if(!match) return res.status(400).json({msg: "Wrong Password"});
        const userId = user[0].id;
        const name = user[0].name;
        const email = user[0].email;
        const role = user[0].role;
        const phone = user[0].phone;
        const address = user[0].address;
        const image_user = user[0].image_user;
        const visa = user[0].visa;
        const passport = user[0].passport;
        const izin = user[0].izin;
        const accessToken = jwt.sign({userId, name, email, role, phone, address, image_user, visa, passport,izin}, process.env.ACCESS_TOKEN_SECRET,{
            expiresIn: '1d'
        });
        const refreshToken = jwt.sign({userId, name, email, role, phone, address, image_user,visa, passport,izin}, process.env.REFRESH_TOKEN_SECRET,{
            expiresIn: '183d'
        });
        await Users.update({refresh_token: refreshToken},{
            where:{
                id: userId
            }
        });
        res.cookie('refreshToken', refreshToken,{
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });

        const data = {
            userId,
            email,
            role,
            phone,
            address,
            accessToken,
            refreshToken,
        };
        return res.status(201).json({
            success: true,
            message: "Login Successfully",
            data: data,
        });
    } catch (error) {
        res.status(404).json({msg:"Email tidak ditemukan"});
    }
}
export const Whoami = async (req, res) => {
    try {
        const users = await Users.findOne({
            where:{
              id: req.user.userId
            },
            attributes:['image_user','name','email', 'role','phone','address','visa','passport','izin']
        });
        res.json(users);
    } catch (error) {
        console.log(error);
    }
}

//update user
export const Update = async(req, res,next) => {
  const users = await Users.findOne({
    where: {
        id: req.user.userId
    }
  });
  const {name, phone, address} = req.body;
  let fileName = "";
  let fileNameVisa = "";
  let fileNamePassport = "";
  let fileNameIzin = "";
  if(req.file === null){
    fileName = Users.image_user;
    fileNameVisa = req.user.visa;
    fileNamePassport = req.user.passport;
    fileNameIzin = req.user.izin;
  }else{
    const file = req.files.image_user;
    const fileVisa = req.files.visa;
    const filePassport = req.files.passport;
    const fileIzin = req.files.izin;
    if(!file || !fileVisa || !filePassport || !fileIzin){
      return res.status(400).json({
        success: false,
        message: "image_user, visa, passport, izin is required",
      });
    }

    const fileSize = file.data.length;
    const fileSizeVisa = fileVisa.data.length;
    const fileSizePassport = filePassport.data.length;
    const fileSizeIzin = fileIzin.data.length;
    
    const ext = path.extname(file.name);
    const extVisa = path.extname(fileVisa.name);
    const extPassport = path.extname(filePassport.name);
    const extIzin = path.extname(fileIzin.name);

    fileName = file.md5 + req.user.name+ ext ;
    fileNameVisa = fileVisa.md5 +req.user.name+ extVisa;
    fileNamePassport = filePassport.md5 +req.user.name + extPassport;
    fileNameIzin = fileIzin.md5 +req.user.name+ extIzin;

    const allowedType = ['.png','.jpg','.jpeg'];

    if(!allowedType.includes(ext.toLowerCase())) return res.status(422).json({msg: "Invalid Images"});
    if(!allowedType.includes(extVisa.toLowerCase())) return res.status(422).json({msg: "Invalid Images"});
    if(!allowedType.includes(extPassport.toLowerCase())) return res.status(422).json({msg: "Invalid Images"});
    if(!allowedType.includes(extIzin.toLowerCase())) return res.status(422).json({msg: "Invalid Images"});

    if(fileSize > 1000000 || fileSizeVisa > 1000000 || fileSizePassport > 1000000 || fileSizeIzin > 1000000) return res.status(422).json({msg: "Image must be less than 1 MB"});
    // if(fileSizeVisa)return res.status(422).json({msg: "Image must be less than 1 MB"});
    file.mv(`./public/images/${fileName}`, (err)=>{
        if(err) return res.status(500).json({msg: err.message});
    });
    fileVisa.mv(`./public/images/${fileNameVisa}`, (err)=>{
      if(err) return res.status(500).json({msg: err.message});
    });
    filePassport.mv(`./public/images/${fileNamePassport}`, (err)=>{
      if(err) return res.status(500).json({msg: err.message});
    });
    fileIzin.mv(`./public/images/${fileNameIzin}`, (err)=>{
      if(err) return res.status(500).json({msg: err.message});
    });
  }
  const url = `${req.protocol}://${req.get("host")}/images/${fileName}`;
  const urlVisa = `${req.protocol}://${req.get("host")}/images/${fileNameVisa}`;
  const urlPassport = `${req.protocol}://${req.get("host")}/images/${fileNamePassport}`;
  const urlIzin = `${req.protocol}://${req.get("host")}/images/${fileNameIzin}`;
  try {
    await Users.update({
      name: name,
      phone: phone,
      address: address,
      visa: urlVisa,
      passport: urlPassport,
      izin: urlIzin,
      image_user: url,
  },{
      where:{
          id: users.id
      }
      
  });
  res.status(200).json({msg: "User Updated"});
  } catch (error) {
    console.log(error);
  }return next;

}

export const Logout = async(req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) return res.sendStatus(204);
    const user = await Users.findAll({
        where:{
            refresh_token: refreshToken
        }
    });
    if(!user[0]) return res.sendStatus(204);
    const userId = user[0].id;
    await Users.update({refresh_token: null},{
        where:{
            id: userId
        }
    });
    res.clearCookie('refreshToken');
    return res.sendStatus(200);
}

