const { response } = require('express');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const { generarJWT } = require('../helpers/jwt');

const crearUsuario = async ( req, res = response ) => {

    const { email, name, password } = req.body;

    try {

        // Verificar el email
        const usuario = await Usuario.findOne({ email: email});

        if ( usuario ) {
            return res.status(400).json ({
                ok: false,
                msg: 'El usuario ya existe con ese email'
            });
        } 

        // Crear el usuario con el modelo
        const dbUser = new Usuario( req.body );

        // Hashear la contraseña
        const salt = bcrypt.genSaltSync();
        dbUser.password = bcrypt.hashSync( password, salt );

        // Generar el JWT
        const token = await generarJWT( dbUser.id, name );

        // Crear el usuario de BD
        dbUser.save();

        // Generar respuestam exitosa
        return res.status(201).json({
            ok: true,
            uid: dbUser.id,
            name,
            email,
            token
        })


    } catch (error) {

        console.log(error);

        return res.status(500).json({
            ok: true,
            msg: 'Crear usuario /new'
        });

    }

}


const loginUsuario = async ( req, res = response ) => {

    const { email, password } = req.body;

    try {

        const dbUser = await Usuario.findOne({ email: email });

        if ( !dbUser ) {
            return res.status(400).json({
                ok: false,
                msg: 'El correo no existe'
            });
        }

        // Confirmar si el password hace match
        const validPassword = bcrypt.compareSync( password, dbUser.password );
        
        if ( !validPassword ) {
            return res.status(400).json({
                ok: false,
                msg: 'El password no es valido'
            });
        }

        // Generar el JWT
        const token = await generarJWT( dbUser.id, dbUser.name );

        // Respuesta del servicio
        return res.json({
            ok: true,
            uid: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            token 
        });


    } catch ( error ) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        });
    }

}

const revalidarToken = async ( req, res ) => {

    const { uid, name } = req;

    //Leer de la base de datos
    const dbUser = await Usuario.findById(uid);

    // Generar nuevo JWT
    const token = await generarJWT( uid, name );

    return res.json({
        ok: true,
        uid, 
        name,
        email: dbUser.email,
        token
    });

}

module.exports = {
    crearUsuario,
    loginUsuario,
    revalidarToken
}