const User = require("../models/User-Model.js");
const Enroll = require("../models/Enrollment-model.js");
const bcryptjs = require("bcryptjs");
const auth = require("../auth.js");

module.exports.registerUser = (req, res) => {
    let newUser = new User({
        firstName: req.body.firstName,
        middleName: req.body.middleName,
        lastName: req.body.lastName,
        email: req.body.email,
        contactNumber: req.body.contactNumber,
        password: bcryptjs.hashSync(req.body.password, 10)
    })

    return newUser.save()
    .then(result => {
        res.send({
            code: "REGISTRATION-SUCCESS",
            message: "You are now registered!",
            result: result
        })
    })
    .catch(error => {
        res.send({
            code: "REGISTRATION-FAILED",
            message: "We've encountered an error during the registration. Please try again!",
            result: error
        })
    })
}

// User Login
module.exports.loginUser = (req, res) =>{
    let {email, password} = req.body;
    return User.findOne({email: email}).then(result => {
        if(result == null){
            return res.send({
                code: "USER-NOT-REGISTERED",
                message: "Please register to login."
            })
        }else{
            const isPasswordCorrect = bcryptjs.compareSync(password, result.password);

            if(isPasswordCorrect){
                return res.send({
                    code: "USER-LOGIN-SUCCESS",
                    token: auth.createAccessToken(result)
                    
                })
                
                
            }else{
                return res.send({
                    code: "PASSWORD-INCORRECT",
                    message: "Password is not correct. Please try again."
                })
            }
        }
    })
}

// Check email if existing
module.exports.checkEmail = (req,res) => {
    let {email} = req.body;
    return User.find({email: email}).then(result => {
        if(result.length > 0){
            return res.send({
                code: "EMAIL-EXISTS",
                message: "The user is registered."
            })
        }else{
            return res.send({
                code: "EMAIL-NOT-EXISTING",
                message: "The user is not registered."
            }) 
        }
    })
}

module.exports.getProfile = (req, res) => {
    const {id} = req.user;
    return User.findById(id).then(result => {
        if(result == null || result.length === 0){
            return res.send({
                code: "USER-NOT-FOUND",
                message: "Cannot find user with the provided ID."
            })
        }else{
            result.password = "*****";
            return res.send({
                code: "USER-FOUND",
                message: "A user was found.",
                result: result
            })
        }
    })
}

// Enroll a user
module.exports.enroll = (req, res) => {
    const {id} = req.user;
    
    let newEnrollment = new Enroll({
        userId: id,
        enrolledCourse: req.body.enrolledCourse,
        totalPrice: req.body.totalPrice
    })

    return newEnrollment.save().then((result, err) => {
        if(err){
            res.send({
                code: "ENROLLMENT-FAILED",
                message: "There is a problem during your enrollment, please try again!",
                error: err
            })
        }else{
            res.send({
                code: "ENROLLMENT-SUCCESSFUL",
                message: "Congratulations, you are now enrolled!",
                result: result
            })
        }
    })
}

// Get a specific user 
module.exports.getSpecificUser = (req, res) => {
    const {id} = req.user;
    return User.findById(id).then(result => {
        if(result == null || result.length === 0){
            return res.send({
                code: "USER-NOT-FOUND",
                message: "Cannot find user with the provided ID."
            })
        }else{
            result.password = "*****";
            return res.send({
                code: "USER-FOUND",
                message: "A user was found.",
                result: result
            })
        }
    })
}

module.exports.updateProfile = (req, res) => {
    const { id } = req.user;
    const { firstName, middleName, lastName, email, contactNumber, password } = req.body;

    const updateData = { firstName, middleName, lastName, email, contactNumber };

    if (password) {
        updateData.password = bcryptjs.hashSync(password, 10);
    }
    User.findOne({ email }).then((existingUser) => {
        if (existingUser && existingUser._id.toString() !== id) {
            return res.send({
                code: "EMAIL-ALREADY-EXISTS",
                message: "The email is already in use. Please choose a different email.",
            });
        }
    User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .then((updatedUser) => {
            if (!updatedUser) {
                return res.send({
                    code: "USER-NOT-FOUND",
                    message: "Cannot find user with the provided ID.",
                });
            }
            res.send({
                code: "USER-UPDATE-SUCCESS",
                message: "Profile updated successfully.",
                result: updatedUser,
            });
        })
        .catch((error) => {
            if (error) {
                res.send({
                    code: "EMAIL-ALREADY-EXISTS",
                    message: "The email is already in use. Please choose a different email.",
                });
            } else {
                res.send({
                    code: "USER-UPDATE-FAILED",
                    message: "An error occurred while updating the profile.",
                    error: error.message,
                });
            }
        });
    })
};

// Get all users
module.exports.getAllUsers = (req, res) => {
    console.log("Fetching all users...");

    User.find({})
        .then(users => {
            if (!users || users.length === 0) {
                return res.status(404).json({
                    code: "USERS-EMPTY",
                    message: "No users found.",
                    userList: []
                });
            }

            // Map users to a structured list
            const userList = users.map(user => ({
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                email: user.email,
                contactNumber: user.contactNumber,
                password: user.password,
                isAdmin: user.isAdmin
            }));

            return res.status(200).json({
                code: "ALL-USERS-RESULT",
                message: "Users retrieved successfully.",
                result: userList
            });
        })
        .catch(error => {
            console.error("Error fetching users:", error);
            return res.status(500).json({
                code: "SERVER-ERROR",
                message: "An error occurred while fetching users.",
                error: error.message
            });
        });
};
