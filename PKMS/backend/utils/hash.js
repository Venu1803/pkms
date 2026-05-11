const argon2 = require("argon2");

exports.hashPassword = async (password)=> {
    return await argon2.hash(password);
};

exports.verifyPassword = async (hashedPassword, inputPassword)=> {
    return await argon2.verify(hashedPassword,inputPassword);
};