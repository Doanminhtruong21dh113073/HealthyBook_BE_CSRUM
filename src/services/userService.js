import db from "../models/index";
import bcrypt, { hashSync } from "bcryptjs";
const salt = bcrypt.genSaltSync(10);

let handleUserPassword = (password) => {
  return new Promise(async (resolve, reject) => {
    try {
      let hashPassword = await bcrypt.hashSync(password, salt);
      resolve(hashPassword);
    } catch (e) {
      reject(e);
    }
  });
};

const handleUserLogin = async (email, password) => {
  return new Promise(async (resolve, reject) => {
    try {
      let userData = {};

      let isExist = await checkUserEmail(email);
      if (isExist) {
        //User already exist
        let user = await db.User.findOne({
          attributes: ["email", "roleId", "password", "firstName", "lastName"],
          where: { email: email },
          raw: true,
        });
        if (user) {
          //Compare password
          let check = bcrypt.compareSync(password, user.password);
          if (check) {
            userData.errCode = 0;
            userData.errMessage = "ok";
            delete user.password;
            userData.user = user;
          } else {
            userData.errCode = 3;
            userData.errMessage = `Wrong password`;
          }
        } else {
          userData.errCode = 2;
          userData.errMessage = `User's not found!`;
        }
      } else {
        //Return code
        userData.errCode = 1;
        userData.errMessage = `Your's Email isn't exist in our system. Please try another email!`;
      }
      resolve(userData);
    } catch (e) {
      reject(e);
    }
  });
};

const checkUserEmail = async (userEmail) => {
  return new Promise(async (resolve, reject) => {
    try {
      let user = await db.User.findOne({
        where: { email: userEmail },
      });
      if (user) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (e) {
      reject(e);
    }
  });
};

const GetAllUsers = async (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let users = "";
      if (userId === "ALL") {
        users = await db.User.findAll({
          attributes: {
            exclude: ["password"],
          },
        });
      }
      if (userId && userId !== "ALL") {
        users = await db.User.findOne({
          where: { id: userId },
          attributes: {
            exclude: ["password"],
          },
        });
      }
      resolve(users);
    } catch (e) {
      reject(e);
    }
  });
};

let createNewUser = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let check = await checkUserEmail(data.email);
      if (check === true) {
        resolve({
          errCode: 1,
          errMessage: "Your email is already in use, please try another email!",
        });
      } else {
        let hashPasswordFromBcrypt = await handleUserPassword(data.password);
        await db.User.create({
          email: data.email,
          password: hashPasswordFromBcrypt,
          firstName: data.firstName,
          lastName: data.lastName,
          address: data.address,
          phoneNumber: data.phoneNumber,
          gender: data.gender === "1" ? true : false,
          roleId: data.roleId,
        });

        resolve({
          errCode: 0,
          message: "OK",
        });
      }
    } catch (e) {
      reject(e); // Xử lý lỗi bằng cách gọi reject
    }
  });
};

let deleteUser = (userId) => {
  return new Promise(async (resolve, reject) => {
    let foundUser = await db.User.findOne({
      where: { id: userId },
    });
    if (!foundUser) {
      resolve({
        errCode: 2,
        errMessage: `The user isn't exist`,
      });
    }

    await db.User.destroy({
      where: { id: userId },
    });
    resolve({
      errCode: 0,
      message: `The user is deleted`,
    });
  });
};

// let updateUserData = (data) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       if (!data.id) {
//         resolve({
//           errCode: 2,
//           errMessage: "Missing required parameters",
//         });
//       }
//       let user = await db.User.findOne({
//         where: { id: data.id },
//         raw: false,
//       });

//       if (user) {
//         user.firstName = data.firstName;
//         user.lastName = data.lastName;
//         user.address = data.address;

//         await user.save();

//         resolve({
//           errCode: 0,
//           message: "Update the user success!",
//         });
//       } else {
//         resolve({
//           errCode: 1,
//           message: `User's not found!`,
//         });
//       }
//     } catch (error) {}
//   });
// };

let updateUserData = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.id || (!data.firstName && !data.lastName && !data.address)) {
        // Kiểm tra xem data.id và ít nhất một trong các trường firstName, lastName, address
        // phải được cung cấp để thực hiện cập nhật.
        resolve({
          errCode: 2,
          errMessage: "Missing required parameters",
        });
      } else {
        let user = await db.User.findOne({
          where: { id: data.id },
          raw: false,
        });

        if (user) {
          // Cập nhật thông tin người dùng nếu người dùng tồn tại và có thông tin hợp lệ.
          if (data.firstName) user.firstName = data.firstName;
          if (data.lastName) user.lastName = data.lastName;
          if (data.address) user.address = data.address;

          await user.save();

          resolve({
            errCode: 0,
            message: "Update the user success!",
          });
        } else {
          resolve({
            errCode: 1,
            message: `User's not found!`,
          });
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};

let getAllCodeService = (typeInput) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!typeInput) {
        reslove({
          errCode: 1,
          errMessage: "Missing required parameters",
        });
      } else {
        let res = {};
        let allcode = await db.Allcode.findAll({
          where: { type: typeInput },
        });
        res.errCode = 0;
        res.data = allcode;
        resolve(res);
      }
    } catch (e) {}
  });
};

module.exports = {
  handleUserLogin: handleUserLogin,
  GetAllUsers: GetAllUsers,
  handleUserPassword: handleUserPassword,
  createNewUser: createNewUser,
  deleteUser: deleteUser,
  updateUserData: updateUserData,
  getAllCodeService: getAllCodeService,
};
