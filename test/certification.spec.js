const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const expect = chai.expect;
const _ = require("lodash")

const server = 'localhost:8000';
const db = require('../server/models');
const User = require('../server/models').User;
const tutors = require('../mock/tutors');

const Errors = require('../server/resources').Errors;
const shouldBeError = require('./helpers').shouldBeError;
const shouldBeNotFound = require('./helpers').shouldBeNotFound;

chai.use(chaiHttp);

let validCertificationNoDiploma = {
    institution: 'Oracle Academy',
    title: 'Java Fundamentals',
    date: new Date('2015-12-08').toISOString(),
}
let validCertificationWDiploma = {
    institution: 'Oracle Academy',
    title: 'Database Design',
    date: new Date('2016-01-10').toISOString(),
    diplomaURL: 'https::storage.container.com/867348dfj'
}

describe('Tutor Certification POST', () => {

    let dbTutor;
    let noCertTutor;
    before(done => {
        db.connectDB()
        .then(async () => {

            dbTutor = await User.findOne({ 'email': tutors[0].email }).exec();
            noCertTutor = await User.findOne({ 'email': tutors[1].email }).exec();

            db.disconnectDB()

            done();
        })
        .catch(err => {
            done(new Error(err));
        });

    });

    it('Valid certification POST no diploma', (done) => {

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/certifications`)
        .send(validCertificationNoDiploma)
        .end((err, res) => {
            res.should.have.status(201);
            res.body.should.be.an('object');

            done();
        });

    });

    it('Valid certification POST w diploma', (done) => {

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/certifications`)
        .send(validCertificationWDiploma)
        .end((err, res) => {
            res.should.have.status(201);
            res.body.should.be.an('object');

            done();
        });

    });

    it('Correct insertion', (done) => {

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/certifications`)
        .send(validCertificationWDiploma)
        .end((err, res) => {
            res.should.have.status(201);
            res.body.should.be.an('object');

            const returnedObj = {
                institution: res.body.institution,
                title: res.body.title,
                date: res.body.date,
                diplomaURL: res.body.diplomaURL
            }
            _.isEqual(returnedObj, validCertificationWDiploma).should.be.eql(true);

            done();
        });

    });

    it('Invalid tutor ID', (done) => {

        chai.request(server)
        .post(`/tutors/qwerty/certifications`)
        .send(validCertificationNoDiploma)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('Tutor not found', (done) => {


        chai.request(server)
        .post(`/tutors/ffffffffffffff0123456789/certifications`)
        .send(validCertificationNoDiploma)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('Failed insert: no institution', (done) => {

        let noInstCert = {...validCertificationWDiploma};
        delete noInstCert.institution;

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/certifications`)
        .send(noInstCert)
        .end((err, res) => {
            shouldBeError(res, done, Errors.MISSING_FIELD);

        });

    });

    it('Failed insert: no title', (done) => {

        let noTitleCert = {...validCertificationWDiploma};
        delete noTitleCert.title;

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/certifications`)
        .send(noTitleCert)
        .end((err, res) => {
            shouldBeError(res, done, Errors.MISSING_FIELD);

        });

    });

    it('Failed insert: no date', (done) => {

        let noDateCert = {...validCertificationWDiploma};
        delete noDateCert.date;

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/certifications`)
        .send(noDateCert)
        .end((err, res) => {
            shouldBeError(res, done, Errors.MISSING_FIELD);

        });

    });

    it('Failed insert: institution too short', (done) => {

        let certCopy = {...validCertificationWDiploma};
        certCopy.institution = "l";

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/certifications`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.SHORT_STRING);

        });

    });

    it('Failed insert: title too short', (done) => {

        let certCopy = {...validCertificationWDiploma};
        certCopy.title = "l";

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/certifications`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.SHORT_STRING);

        });

    });

    it('Failed insert: date wrong format', (done) => {

        let certCopy = {...validCertificationWDiploma};
        certCopy.date = "1999-30-15";

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/certifications`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_FORMAT);

        });

    });

    it('Failed insert: date is in the future', (done) => {

        let certCopy = {...validCertificationWDiploma};
        certCopy.date = new Date();
        certCopy.date.setDate(certCopy.date.getDate() + 1);

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/certifications`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.DATE_IN_FUTURE);

        });

    });

    it('Failed insert: diploma url is invalid', (done) => {

        let certCopy = {...validCertificationWDiploma};
        certCopy.diplomaURL = 'agjkgjadk';

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/certifications`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_URL);

        });

    });

});

describe ('Tutor Certification GET/:id', () => {

    let dbTutor;
    let existingCert;

    before(done => {
        db.connectDB()
        .then(async () => {

            dbTutor = await User.findOne({ 'email': tutors[0].email }).exec();

            existingCert = dbTutor.tutorDetails.certifications[0];

            db.disconnectDB()

            done();
        })
        .catch(err => {
            done(new Error(err));
        });

    });

    it('Invalid tutor ID', (done) => {

        chai.request(server)
        .get(`/tutors/qwerty/certifications/${existingCert._id}`)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('Tutor not found', (done) => {


        chai.request(server)
        .get(`/tutors/ffffffffffffff0123456789/certifications/${existingCert._id}`)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('Invalid certification ID', (done) => {

        chai.request(server)
        .get(`/tutors/${dbTutor._id}/certifications/qwerty`)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('Certification not found', (done) => {


        chai.request(server)
        .get(`/tutors/${dbTutor._id}/certifications/ffffffffffffff0123456789`)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('Valid GET/:id', (done) => {

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/certifications`)
        .send(validCertificationWDiploma)
        .end((err, res) => {
            res.should.have.status(201);
            res.body.should.be.an('object');
            res.body.should.have.property('_id');

            chai.request(server)
            .get(`/tutors/${dbTutor._id}/certifications/${res.body._id}`)
            .end ((err2, res2) => {

                res2.should.have.status(200);
                _.isEqual(res2.body, res.body).should.be.eql(true); //GET obj is value-equal to the one returned by POST

                done();
            });
        });

        
    });

});

describe ('Tutor Certification GET', () => {
    let noCertTutor;
    let dbTutor;

    before(done => {
        db.connectDB()
        .then(async () => {

            dbTutor = await User.findOne({ 'email': tutors[0].email }).exec();
            noCertTutor = await User.findOne({ 'email': tutors[1].email }).exec();

            db.disconnectDB()

            done();
        })
        .catch(err => {
            done(new Error(err));
        });

    });

    it('Invalid tutor ID', (done) => {

        chai.request(server)
        .get(`/tutors/qwerty/certifications`)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('Tutor not found', (done) => {

        chai.request(server)
        .get(`/tutors/ffffffffffffff0123456789/certifications`)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('GET of tutor with no certifications', (done) => {

        chai.request(server)
        .get(`/tutors/${noCertTutor._id}/certifications`)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.an('array').that.is.empty;

            done();
        });

    });

    it('Correct get of certifications', (done) => {

        //Insert 1 cert in a tutor with none
        chai.request(server)
        .post(`/tutors/${noCertTutor._id}/certifications`)
        .send(validCertificationWDiploma)
        .end((err, res) => {

            res.should.have.status(201);
            res.body.should.be.an('object');

            //Insert other cert in same tutor
            chai.request(server)
            .post(`/tutors/${noCertTutor._id}/certifications`)
            .send(validCertificationNoDiploma)
            .end((err2, res2) => {
                res2.should.have.status(201);
                res2.body.should.be.an('object');

                //Verify GET of both certifications 
                chai.request(server)
                .get(`/tutors/${noCertTutor._id}/certifications`)
                .end((err3, res3) => {

                    res3.should.have.status(200);
                    res3.body.should.be.an('array').that.is.not.empty;
                    res3.body.should.have.length(2);

                    const resCert1 = {
                        institution: res3.body[0].institution,
                        title: res3.body[0].title,
                        date: res3.body[0].date,
                        diplomaURL: res3.body[0].diplomaURL
                    }
                    const resCert2 = {
                        institution: res3.body[1].institution,
                        title: res3.body[1].title,
                        date: res3.body[1].date,
                    }


                    _.isEqual(resCert1, validCertificationWDiploma).should.be.eql(true); 
                    _.isEqual(resCert2, validCertificationNoDiploma).should.be.eql(true); 

                    done();
                });
            });

            
        });

    });

});

describe('Tutor Certification PUT', () => {

    let dbTutor;
    let updateCert;

    before(done => {
        db.connectDB()
        .then(async () => {

            dbTutor = await User.findOne({ 'email': tutors[2].email }).exec();
            updateCert = dbTutor.tutorDetails.certifications[0];

            db.disconnectDB()

            done();
        })
        .catch(err => {
            done(new Error(err));
        });

    });

    it('Valid certification PUT no diploma', (done) => {

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/certifications/${updateCert._id}`)
        .send(validCertificationNoDiploma)
        .end((err, res) => {

            res.should.have.status(200);
            res.body.should.be.an('object');

            done();
        });

    });

    it('Valid certification PUT w diploma', (done) => {

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/certifications/${updateCert._id}`)
        .send(validCertificationWDiploma)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.an('object');

            done();
        });

    });

    it('Correct update', (done) => {

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/certifications/${updateCert._id}`)
        .send(validCertificationWDiploma)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.an('object');

            const returnedObj = {
                institution: res.body.institution,
                title: res.body.title,
                date: res.body.date,
                diplomaURL: res.body.diplomaURL
            }
            _.isEqual(returnedObj, validCertificationWDiploma).should.be.eql(true);

            done();
        });

    });

    it('Invalid tutor ID', (done) => {

        chai.request(server)
        .put(`/tutors/qwerty/certifications/${updateCert._id}`)
        .send(validCertificationNoDiploma)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('Tutor not found', (done) => {


        chai.request(server)
        .put(`/tutors/ffffffffffffff0123456789/certifications/${updateCert._id}`)
        .send(validCertificationNoDiploma)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('Invalid certification ID', (done) => {

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/certifications/qwerty`)
        .send(validCertificationNoDiploma)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('Certification not found', (done) => {


        chai.request(server)
        .put(`/tutors/${dbTutor._id}/certifications/ffffffffffffff0123456789`)
        .send(validCertificationNoDiploma)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('Failed update: no institution', (done) => {

        let noInstCert = {...validCertificationWDiploma};
        delete noInstCert.institution;

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/certifications/${updateCert._id}`)
        .send(noInstCert)
        .end((err, res) => {
            shouldBeError(res, done, Errors.MISSING_FIELD);

        });

    });

    it('Failed update: no title', (done) => {

        let noTitleCert = {...validCertificationWDiploma};
        delete noTitleCert.title;

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/certifications/${updateCert._id}`)
        .send(noTitleCert)
        .end((err, res) => {
            shouldBeError(res, done, Errors.MISSING_FIELD);

        });

    });

    it('Failed update: no date', (done) => {

        let noDateCert = {...validCertificationWDiploma};
        delete noDateCert.date;

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/certifications/${updateCert._id}`)
        .send(noDateCert)
        .end((err, res) => {
            shouldBeError(res, done, Errors.MISSING_FIELD);

        });

    });

    it('Failed update: institution too short', (done) => {

        let certCopy = {...validCertificationWDiploma};
        certCopy.institution = "l";

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/certifications/${updateCert._id}`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.SHORT_STRING);

        });

    });

    it('Failed update: title too short', (done) => {

        let certCopy = {...validCertificationWDiploma};
        certCopy.title = "l";

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/certifications/${updateCert._id}`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.SHORT_STRING);

        });

    });

    it('Failed update: date wrong format', (done) => {

        let certCopy = {...validCertificationWDiploma};
        certCopy.date = "1999-30-15";

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/certifications/${updateCert._id}`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_FORMAT);

        });

    });

    it('Failed update: date is in the future', (done) => {

        let certCopy = {...validCertificationWDiploma};
        certCopy.date = new Date();
        certCopy.date.setDate(certCopy.date.getDate() + 1);

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/certifications/${updateCert._id}`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.DATE_IN_FUTURE);

        });

    });

    it('Failed update: diploma url is invalid', (done) => {

        let certCopy = {...validCertificationWDiploma};
        certCopy.diplomaURL = 'agjkgjadk';

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/certifications/${updateCert._id}`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_URL);

        });

    });

});

describe ('Tutor Certification DELETE', () => {

    let dbTutor;
    let existingCert;

    before(done => {
        db.connectDB()
        .then(async () => {

            dbTutor = await User.findOne({ 'email': tutors[2].email }).exec();

            existingCert = dbTutor.tutorDetails.certifications[0];

            db.disconnectDB()

            done();
        })
        .catch(err => {
            done(new Error(err));
        });

    });


    it('Invalid tutor ID', (done) => {

        chai.request(server)
        .delete(`/tutors/qwerty/certifications/${existingCert._id}`)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('Tutor not found', (done) => {


        chai.request(server)
        .delete(`/tutors/ffffffffffffff0123456789/certifications/${existingCert._id}`)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('Invalid certification ID', (done) => {

        chai.request(server)
        .delete(`/tutors/${dbTutor._id}/certifications/qwerty`)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('Certification not found', (done) => {


        chai.request(server)
        .delete(`/tutors/${dbTutor._id}/certifications/ffffffffffffff0123456789`)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('Correct deletion', (done) => {

        chai.request(server)
        .delete(`/tutors/${dbTutor._id}/certifications/${existingCert._id}`)
        .end((err, res) => {
            res.should.have.status(200);

            chai.request(server)
            .get(`/tutors/${dbTutor._id}/certifications/`)
            .end((err, res) => {

                res.should.have.status(200);
                res.body.should.be.an('array').that.is.empty;

                done();
                
            });
        });

    });













































































































































































































































































































































































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    
});