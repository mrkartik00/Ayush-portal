import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema({
    name: String,
    email: String,
    password: String,
    dateOfBirth: Date,
    verified: Boolean,
});

const User = mongoose.model('User', UserSchema);
export default User;