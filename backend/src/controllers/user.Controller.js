import bcrypt from 'bcrypt';
import { User, UserVerification, PasswordReset } from '../models';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { sendVerificationEmail, validateRegex, getTranporter } from '../utils';
import { OK, SERVER_ERROR, BAD_REQUEST } from '../constants/statusCodes';
import { cookieOptions } from '../constants/cookie';
import { generateTokens } from '../utils/generateTokens';

// verify email
userRouter.get('/verify/:userId/:uniqueString', (req, res) => {
    let { userId, uniqueString } = req.params;
    UserVerification.find({ userId })
        .then((result) => {
            if (result.length > 0) {
                //user verification record exists
                const { expiresAt } = result[0];
                const hashedUniqueString = result[0].uniqueString;

                // checking for expired unique string
                if (expiresAt < Date.now()) {
                    // record has expired so we delete it
                    UserVerification.deleteOne({ userId })
                        .then((result) => {
                            User.deleteOne({ _id: userId })
                                .then(() => {
                                    let message =
                                        'Link has expired please sign up again.';
                                    res.redirect(
                                        `/user/verified/error=true&message=${message}`
                                    );
                                })
                                .catch((error) => {
                                    console.log(error);
                                    let message =
                                        'Clearing user with existing record failed';
                                    res.redirect(
                                        `/user/verified/error=true&message=${message}`
                                    );
                                });
                        })
                        .catch((error) => {
                            console.log(error);
                            let message =
                                'An error occured while clearing expired user verification record';
                            res.redirect(
                                `/user/verified/error=true&message=${message}`
                            );
                        });
                } else {
                    //valid record exists validate user string
                    //first compare the hashed unique string

                    bcrypt
                        .compare(uniqueString, hashedUniqueString)
                        .then((result) => {
                            if (result) {
                                //strings match
                                User.updateOne(
                                    { _id: userId },
                                    { verified: true }
                                ).then(() => {
                                    UserVerification.deleteOne({ userId })
                                        .then(() => {
                                            UserVerification.deleteOne({
                                                userId,
                                            })
                                                .then(() => {
                                                    res.sendFile(
                                                        path.join(
                                                            __dirname,
                                                            'Ayush-portal/backend/src/views/verified.html'
                                                        )
                                                    );
                                                })
                                                .catch((error) => {
                                                    console.log(error);
                                                    let message =
                                                        'An error occured while finalizing successful verification.';
                                                    res.redirect(
                                                        `/user/verified/error=true&message=${message}`
                                                    );
                                                });
                                        })
                                        .catch((error) => {
                                            console.log(error);
                                            let message =
                                                'An error occured while updating user record to show verified.';
                                            res.redirect(
                                                `/user/verified/error=true&message=${message}`
                                            );
                                        });
                                });
                            } else {
                                // existing record but incorrect verification details
                                let message =
                                    'Invalid verification details passed check verification details';
                                res.redirect(
                                    `/user/verified/error=true&message=${message}`
                                );
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            let message =
                                'An error occured while comparing unique string';
                            res.redirect(
                                `/user/verified/error=true&message=${message}`
                            );
                        });
                }
            } else {
                //user verification record doesnt exist
                let message =
                    'Account record doesnt exist or has been verified already. Please sign up or login';
                res.redirect(`/user/verified/error=true&message=${message}`);
            }
        })
        .catch((error) => {
            console.log(error);
            let message =
                'An error occured while checking for existing user verification record';
            res.redirect(`/user/verified/error=true&message=${message}`);
        });
});

//verified page route
userRouter.get('/verified', (req, res) => {
    res.sendFile(path.join(__dirname, './../views/verified.html'));
});

const register = async (req, res) => {
    try {
        let { name, email, password, dateOfBirth, phone } = req.body;
        name = name.trim();
        email = email.trim();
        dateOfBirth = dateOfBirth.trim();
        phone = phone.trim();

        if (
            name === '' ||
            email === '' ||
            password === '' ||
            dateOfBirth === ''
        ) {
            return res.status(BAD_REQUEST).json({
                message: 'Empty input fields!',
            });
        }

        // regex validation
        let regexError = validateRegex('name', name);
        if (regexError) {
            return res.status(BAD_REQUEST).json({
                message: regexError,
            });
        }

        regexError = validateRegex('email', email);
        if (regexError) {
            return res.status(BAD_REQUEST).json({
                message: regexError,
            });
        }

        regexError = validateRegex('password', password);
        if (regexError) {
            return res.status(BAD_REQUEST).json({
                message: regexError,
            });
        }

        regexError = validateRegex('DOB', dateOfBirth);
        if (regexError) {
            return res.status(BAD_REQUEST).json({
                message: regexError,
            });
        }

        //check if user already exists
        const user = await User.findOne({ email });
        if (user) {
            //Already exists
            res.status(BAD_REQUEST).json({
                message: 'User exists with this email',
            });
        } else {
            //create new user

            //password hashing
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            if (!hashedPassword) {
                res.status(SERVER_ERROR).json({
                    message: 'An error occured while hashing password !',
                });
            }

            // create user
            const newUser = await User.create({
                name,
                email,
                password: hashedPassword,
                dateOfBirth,
                phone,
                verified: false,
            });

            // send mail
            if (newUser) {
                await sendVerificationEmail(newUser, res);
            } else {
                res.status(SERVER_ERROR).json({
                    message: 'An error occured while registering user',
                });
            }
        }
    } catch (err) {
        res.status(SERVER_ERROR).json({
            message: 'An error occured while checking for existing user !',
            error: err.message,
        });
    }
};

const login = async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.trim();
        password = password.trim();

        if (email === '' || password === '') {
            res.status(BAD_REQUEST).json({
                message: 'Empty credentials provided !',
            });
        }

        //check if user exists
        const user = await User.findOne({ email });
        if (user) {
            //user exists

            //check if user is verified
            if (!user.verified) {
                res.status(BAD_REQUEST).json({
                    message:
                        'Email has not been verified yet. Check your inbox',
                });
            } else {
                const hashedPassword = user.password;
                const isPasswordVerified = bcrypt.compare(
                    password,
                    hashedPassword
                );
                if (isPasswordVerified) {
                    // generate tokens
                    const { accessToken, refreshToken } = generateTokens(user);

                    // send cookies
                    res.status(OK)
                        .cookie('accessToken', accessToken, {
                            ...cookieOptions,
                            maxAge: parseInt(process.env.ACCESS_TOKEN_MAXAGE),
                        })
                        .cookie('refreshToken', refreshToken, {
                            ...cookieOptions,
                            maxAge: parseInt(process.env.REFRESH_TOKEN_MAXAGE),
                        })
                        .json(user);
                } else {
                    res.status(BAD_REQUEST).json({
                        message: 'Invalid password !',
                    });
                }
            }
        } else {
            res.status(BAD_REQUEST).json({
                message: 'user not found.',
            });
        }
    } catch (err) {
        return res.status(SERVER_ERROR).json({
            message: 'error occured while logging the user.',
            error: error.message,
        });
    }
};

// reset password logics
const requestResetPassword = async (req, res) => {
    try {
        const { email, redirectUrl } = req.body;

        //check if user exists
        const user = await User.find({ email });
        if (user) {
            //check if user is verified
            if (!user.verified) {
                res.status(BAD_REQUEST).json({
                    message:
                        'Email has not been verified yet. Check your inbox',
                });
            } else {
                //proceed with email to reset password
                sendPasswordResetEmail(user, redirectUrl, res);
            }
        } else {
            res.status(BAD_REQUEST).json({
                message: 'No user with the provided email exists !',
            });
        }
    } catch (err) {
        res.status(SERVER_ERROR).json({
            message: 'error occured while requesting for reset password',
            error: err.message,
        });
    }
};

const sendPasswordResetEmail = async (user, redirectUrl, res) => {
    try {
        const { _id, email } = user;
        const resetString = uuid() + _id;

        //Clear existing reset records
        PasswordReset.deleteMany({ userId: _id }).then((result) => {
            //reset records deleted successfully

            //send the email
            const mailOptions = {
                from: process.env.AUTH_EMAIL,
                to: email,
                subject: 'Password reset',
                html: `
                        <p>Reset password with below link and login to your account.</p> 
                        <p>This link will <b>expire in an hour.</b></p> 
                        <p>Press <a href=${redirectUrl + 'user/verify/' + _id + '/' + resetString}> here </a> to proceed.</p>
                    `,
            };

            // hash the reset string
            bcrypt
                .hash(resetString, 10)
                .then((hashedResetString) => {
                    //set values in password reset collection
                    const newPasswordReset = new PasswordReset({
                        userId: _id,
                        resetString: hashedResetString,
                        createdAt: Date.now(),
                        expiresAt: Date.now() + 3600000,
                    });
                    newPasswordReset
                        .save()
                        .then(() => {
                            const transporter = getTranporter();
                            transporter
                                .sendMail(mailOptions)
                                .then(() => {
                                    //reset email sent and password reset record saved
                                    res.status(PENDING).json({
                                        message: 'Password reset email sent!',
                                    });
                                })
                                .catch((error) => {
                                    console.log(error);
                                    throw new Error(
                                        `Password reset email failed!, error: ${error}`
                                    );
                                })
                                .catch((error) => {
                                    console.log(error);
                                    throw new Error(
                                        `Couldnt save the password reset data! , error: ${error}`
                                    );
                                });
                        })
                        .catch((error) => {
                            console.log(error);
                            throw new Error(
                                `An error occurred while hashing the password reset data!, error: ${error}`
                            );
                        });
                })
                .catch((error) => {
                    //error while clearing existing records
                    console.log(error);
                    throw new Error(
                        `Clearing existing password reset records failed, error: ${error}`
                    );
                });
        });

        //Actual reset password
        await resetPassword(req, res);
    } catch (err) {
        res.status(SERVER_ERROR).json({
            message: 'error occured while sending password reset email',
            error: err.message,
        });
    }
};

const resetPassword = async (req, res) => {
    let { userId, resetString, newPassword } = req.body;

    PasswordReset.find({ userId })
        .then((result) => {
            if (result.length > 0) {
                //password reset record exists so we proceed
                const { expiresAt } = result[0];
                const hashedResetString = result[0].resetString;
                //checking for expired reset string
                if (expiresAt < Date.now()) {
                    PasswordReset.deleteOne({ userId })
                        .then(() => {
                            // Reset record deleted successfully
                            res.json({
                                status: 'FAILED',
                                message: 'Password reset link has expired',
                            });
                        })
                        .catch((error) => {
                            //deletion failed
                            console.log(error);
                            res.json({
                                status: 'FAILED',
                                message:
                                    'Clearing password reset record failed',
                            });
                        });
                } else {
                    //valid reset record exists so we validate the reset string
                    //first compare the hashed reset string

                    bcrypt
                        .compare(resetString, hashedResetString)
                        .then((result) => {
                            if (result) {
                                //strings matched
                                //hash password again

                                const saltRounds = 10;
                                bcrypt
                                    .hash(newPassword, saltRounds)
                                    .then((hashedNewPassword) => {
                                        //update user password
                                        User.updateOne(
                                            { _id: userId },
                                            { password: hashedNewPassword }
                                        )
                                            .then(() => {
                                                //update complete delete reset record
                                                PasswordReset.deleteOne(
                                                    { userId }
                                                        .then(() => {
                                                            //both user record and reset record updated
                                                            res.json({
                                                                status: 'SUCCESS',
                                                                message:
                                                                    'Password has been reset successfully',
                                                            });
                                                        })
                                                        .catch((error) => {
                                                            console.log(error);
                                                            res.json({
                                                                status: 'FAILED',
                                                                message:
                                                                    'An error occured while finalizing password reset',
                                                            });
                                                        })
                                                );
                                            })
                                            .catch((error) => {
                                                console.log(error);
                                                res.json({
                                                    status: 'FAILED',
                                                    message:
                                                        'Updating user password failed',
                                                });
                                            });
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                        res.json({
                                            status: 'FAILED',
                                            message:
                                                'An Error while hashing new password',
                                        });
                                    });
                            } else {
                                //existing record but incorrect reset string
                                res.json({
                                    status: 'FAILED',
                                    message:
                                        'Invalid password reset details passed',
                                });
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            res.json({
                                status: 'FAILED',
                                message:
                                    'Comparing password resetr string failed',
                            });
                        });
                }
            } else {
                // password reset account doesnt exists
                res.json({
                    status: 'FAILED',
                    message: 'Password reset request not found.',
                });
            }
        })
        .catch((error) => {
            console.log(error);
            res.json({
                status: 'FAILED',
                message: 'Checking for existing password reset records failed',
            });
        });
};

export {
    register,
    login,
    resetPassword,
    requestResetPassword,
    sendPasswordResetEmail,
};