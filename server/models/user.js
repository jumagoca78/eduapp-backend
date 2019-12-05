// Mongoose schema definition for user entity
var mongoose = require('mongoose');
const paymentMethods = require('../resources').paymentMethods;

const userSchema = new mongoose.Schema({
    uid: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true
    },
    name: {
        type: String
    },
    phone: {
        type: Number,
        unique: true
    },
    country: {
        type: String
    },
    language: {
        type: String
    },
    tutorDetails: {
        type: {
            paymentAccounts: {
                type: [{
                    method: {
                        type: String,
                        enum: paymentMethods
                    }
                }]
            },
            skills: {
                type: [{
                    topic: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Topic',
                        required: true
                    },
                    experience:{
                        type: Number,
                        required: true
                    }
                }]
            },
            workExperience: {
                type: [{
                    placeHolder: {
                        type: String
                    }
                }]
            },
            studies: {
                type: [{
                    institution: {
                        required: true,
                        type: String,
                    },
                    degree: {
                        required: true,
                        type: String,
                    },
                    field: {
                        required: true,
                        type: String,
                    },
                    grade: {
                        required: true,
                        type: Number,
                    },
                    startDate: {
                        required: true,
                        type: Date,
                        validate: [datesOrder, 'endDate should be after startDate']
                    },
                    endDate: {
                        required: true,
                        type: Date,
                        validate: [datesOrder, 'endDate should be after startDate']
                    },
                    proofDocURL: {},
                    validationDate: {
                        required: true,
                        type: Date
                    }
                }]
            },
            certifications: {
                type: [{
                    institution: {
                        type: String,
                        required: true
                    },
                    title: {
                        type: String,
                        required: true
                    },
                    date: {
                        type: Date,
                        required: true
                    },
                    diplomaURL: {
                        type: String
                    }
                }]
            }

        }
    }
});

function datesOrder() {
    return this.endDate > this.startDate;
}

const User = mongoose.model('User', userSchema);
module.exports = User;
