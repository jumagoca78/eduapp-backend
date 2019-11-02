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

let workExpStillWorking = {
    institution: 'CD Project Red',
    department: 'Game Director',
    beginDate: new Date('2012-05-28').toISOString(),
    endDate: new Date('2020-08-17').toISOString(),
    stillWorking: true
}

let workExp = {
    institution: 'Lucid Inc.',
    department: 'Software Enginner Intern',
    beginDate: new Date('2019-05-28').toISOString(),
    endDate: new Date('2019-08-18').toISOString(),
    stillWorking: false
}

describe('WorkExp POST', () => {

    let dbTutor;
    let noWETutor;
    before(done => {
        db.connectDB()
        .then(async () => {

            dbTutor = await User.findOne({ 'email': tutors[0].email }).exec();
            noWETutor = await User.findOne({ 'email': tutors[1].email }).exec();

            db.disconnectDB()

            done();
        })
        .catch(err => {
            done(new Error(err));
        });

    });

    it('Valid work exp POST no stillWorking', (done) => {

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(workExp)
        .end((err, res) => {

            res.should.have.status(201);
            res.body.should.be.an('object');

            done();
        });

    });

    it('Valid work exp POST still working (beginDate is after endDate)', (done) => {

        let we = {...workExpStillWorking};
        we.beginDate = new Date(we.beginDate);
        we.endDate = new Date(we.endDate);

        we.endDate.setDate(we.beginDate.getDate() + 1);

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(we)
        .end((err, res) => {
            res.should.have.status(201);
            res.body.should.be.an('object');

            done();
        });

    });

    it('Valid work exp POSt still working (endDate is in the future)', (done) => {

        let we = {...workExpStillWorking};
        we.beginDate = new Date(we.beginDate);
        we.endDate = new Date(we.endDate);

        we.endDate.setDate((new Date()).getDate() + 10);

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(we)
        .end((err, res) => {
            res.should.have.status(201);
            res.body.should.be.an('object');

            done();
        });

    });

    it('Correct insertion no "stillWorking" field', (done) => {

        let we = {
            institution: 'Google',
            department: 'Intern',
            beginDate: new Date('2019-01-01').toISOString(),
            endDate: new Date('2019-06-01').toISOString(),
        }

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(we)
        .end((err, res) => {
            res.should.have.status(201);
            res.body.should.be.an('object');

            const returnedObj = {
                institution: res.body.institution,
                department: res.body.department,
                beginDate: res.body.beginDate,
                endDate: res.body.endDate,
                stillWorking: false //field is added in controller if not present
            }
            we.stillWorking = false;
            _.isEqual(returnedObj, we).should.be.eql(true);

            done();
        });

    });

    it('Invalid tutor Id', (done) => {

        chai.request(server)
        .post(`/tutors/qwerty/workexperiences`)
        .send(workExp)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('Tutor not found', (done) => {

        chai.request(server)
        .post(`/tutors/ffffffffffffff0123456789/workexperiences`)
        .send(workExp)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('Failed insert: no institution', (done) => {

        let noInstCert = {...workExp};
        delete noInstCert.institution;

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(noInstCert)
        .end((err, res) => {
            shouldBeError(res, done, Errors.MISSING_FIELD);

        });

    });

    it('Failed insert: no department', (done) => {

        let noTitleCert = {...workExp};
        delete noTitleCert.department;

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(noTitleCert)
        .end((err, res) => {
            shouldBeError(res, done, Errors.MISSING_FIELD);

        });

    });

    it('Failed insert: no begin Date', (done) => {

        let noDateCert = {...workExp};
        delete noDateCert.beginDate;

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(noDateCert)
        .end((err, res) => {
            shouldBeError(res, done, Errors.MISSING_FIELD);

        });

    });

    it('Failed insert: no end Date', (done) => {

        let noDateCert = {...workExp};
        delete noDateCert.endDate;

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(noDateCert)
        .end((err, res) => {
            shouldBeError(res, done, Errors.MISSING_FIELD);

        });

    });

    it('Failed insert: endDate before beginDate (limit range)', (done) => {

        let we = {...workExp};
        we.beginDate = new Date('1990-04-12').toISOString();
        we.endDate = new Date('1990-04-11').toISOString();

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(we)
        .end((err, res) => {
            shouldBeError(res, done, Errors.DATE_ORDER);

        });
    });

    it('Failed insert: endDate before beginDate (lower range)', (done) => {

        let we = {...workExp};
        we.beginDate = new Date('1990-04-12').toISOString();
        we.endDate = new Date('1900-01-01').toISOString();

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(we)
        .end((err, res) => {
            shouldBeError(res, done, Errors.DATE_ORDER);

        });
    });

    it('Failed insert: endDate = beginDate', (done) => {

        let we = {...workExp};
        we.beginDate = new Date('1990-04-12').toISOString();
        we.endDate = new Date('1900-04-12').toISOString();

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(we)
        .end((err, res) => {
            shouldBeError(res, done, Errors.DATE_ORDER);

        });
    });

    it('Failed insert: institution too short', (done) => {

        let certCopy = {...workExp};
        certCopy.institution = "l";

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.SHORT_STRING);

        });

    });

    it('Failed insert: department too short', (done) => {

        let certCopy = {...workExp};
        certCopy.department = "l";

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.SHORT_STRING);

        });

    });

    it('Failed insert: beginDate wrong format', (done) => {

        let certCopy = {...workExp};
        certCopy.beginDate = "99/1212";

        certCopy.stillWorking = true;

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_FORMAT);

        });

    });

    it('Failed insert: endDate wrong format', (done) => {

        let certCopy = {...workExp};
        certCopy.endDate = "99/1212";

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_FORMAT);

        });

    });

    it('Failed insert: beginDate invalid value', (done) => {

        let certCopy = {...workExp};
        certCopy.beginDate = '1999-200-200';

        certCopy.stillWorking = true;

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_FORMAT);

        });

    });

    it('Failed insert: endDate invalid value', (done) => {

        let certCopy = {...workExp};
        certCopy.endDate = '2020-200-100';

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_FORMAT);

        });

    });

    it('Failed insert: beginDate is in the future', (done) => {

        let certCopy = {...workExp};
        certCopy.beginDate = new Date();
        certCopy.beginDate.setDate(certCopy.beginDate.getDate() + 1);

        certCopy.endDate = new Date();
        certCopy.endDate.setDate(certCopy.beginDate.getDate() + 10);

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.DATE_IN_FUTURE);

        });

    });

    it('Failed insert: endDate is in the future', (done) => {

        let certCopy = {...workExp};

        certCopy.endDate = new Date();
        certCopy.endDate.setDate(certCopy.endDate.getDate() + 10);

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.DATE_IN_FUTURE);

        });

    });


});

describe ('WorkExp GET/:id', () => {

    let dbTutor;
    let existingWE;

    before(done => {
        db.connectDB()
        .then(async () => {

            dbTutor = await User.findOne({ 'email': tutors[0].email }).exec();

            existingWE = dbTutor.tutorDetails.workExperiences[0];

            db.disconnectDB()

            done();
        })
        .catch(err => {
            done(new Error(err));
        });

    });

    it('Invalid tutor Id', (done) => {

        chai.request(server)
        .get(`/tutors/qwerty/workexperiences/${existingWE._id}`)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('Tutor not found', (done) => {


        chai.request(server)
        .get(`/tutors/ffffffffffffff0123456789/workexperiences/${existingWE._id}`)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('Invalid workExp Id', (done) => {

        chai.request(server)
        .get(`/tutors/${dbTutor._id}/workexperiences/qwerty`)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('workExp not found', (done) => {


        chai.request(server)
        .get(`/tutors/${dbTutor._id}/workexperiences/ffffffffffffff0123456789`)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('Valid GET/:id', (done) => {

        chai.request(server)
        .post(`/tutors/${dbTutor._id}/workexperiences`)
        .send(workExp)
        .end((err, res) => {
            res.should.have.status(201);
            res.body.should.be.an('object');
            res.body.should.have.property('_id');

            chai.request(server)
            .get(`/tutors/${dbTutor._id}/workexperiences/${res.body._id}`)
            .end ((err2, res2) => {

                res2.should.have.status(200);
                _.isEqual(res2.body, res.body).should.be.eql(true); //GET obj is value-equal to the one returned by POST

                done();
            });
        });

        
    });

});

describe ('WorkExp GET', () => {
    let noWETutor;

    before(done => {
        db.connectDB()
        .then(async () => {

            noWETutor = await User.findOne({ 'email': tutors[1].email }).exec();

            db.disconnectDB()

            done();
        })
        .catch(err => {
            done(new Error(err));
        });

    });

    it('Invalid tutor Id', (done) => {

        chai.request(server)
        .get(`/tutors/qwerty/workexperiences`)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('Tutor not found', (done) => {

        chai.request(server)
        .get(`/tutors/ffffffffffffff0123456789/workexperiences`)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('GET of tutor with no work experiences', (done) => {

        chai.request(server)
        .get(`/tutors/${noWETutor._id}/workexperiences`)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.an('array').that.is.empty;

            done();
        });

    });

    it('Correct get of work experiences', (done) => {

        //Insert 1 WE in a tutor with none
        chai.request(server)
        .post(`/tutors/${noWETutor._id}/workexperiences`)
        .send(workExp)
        .end((err, res) => {

            res.should.have.status(201);
            res.body.should.be.an('object');

            //Insert other WE in same tutor
            chai.request(server)
            .post(`/tutors/${noWETutor._id}/workexperiences`)
            .send(workExpStillWorking)
            .end((err2, res2) => {
                res2.should.have.status(201);
                res2.body.should.be.an('object');

                //Verify GET of both work experiences 
                chai.request(server)
                .get(`/tutors/${noWETutor._id}/workexperiences`)
                .end((err3, res3) => {

                    res3.should.have.status(200);
                    res3.body.should.be.an('array').that.is.not.empty;
                    res3.body.should.have.length(2);

                    const resCert1 = {
                        institution: res3.body[0].institution,
                        department: res3.body[0].department,
                        beginDate: res3.body[0].beginDate,
                        endDate: res3.body[0].endDate,
                        stillWorking: false
                    }
                    const resCert2 = {
                        institution: res3.body[1].institution,
                        department: res3.body[1].department,
                        beginDate: res3.body[1].beginDate,
                        endDate: res3.body[1].endDate,
                        stillWorking: true
                    }

                    _.isEqual(resCert1, workExp).should.be.eql(true); 
                    _.isEqual(resCert2, workExpStillWorking).should.be.eql(true); 

                    done();
                });
            });

            
        });

    });

});

describe('WorkExp PUT', () => {

    let dbTutor;
    let updateWE;

    before(done => {
        db.connectDB()
        .then(async () => {

            dbTutor = await User.findOne({ 'email': tutors[2].email }).exec();
            updateWE = dbTutor.tutorDetails.workExperiences[0];

            db.disconnectDB()

            done();
        })
        .catch(err => {
            done(new Error(err));
        });

    });

    it('Valid work exp PUT no stillWorking', (done) => {

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(workExp)
        .end((err, res) => {

            res.should.have.status(200);
            res.body.should.be.an('object');

            done();
        });

    });

    it('Valid work exp PUT still working (beginDate is after endDate)', (done) => {

        let we = {...workExpStillWorking};
        we.beginDate = new Date(we.beginDate);
        we.endDate = new Date(we.endDate);

        we.endDate.setDate(we.beginDate.getDate() + 1);

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(we)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.an('object');

            done();
        });

    });

    it('Valid work exp PUT still working (endDate is in the future)', (done) => {

        let we = {...workExpStillWorking};
        we.beginDate = new Date(we.beginDate);
        we.endDate = new Date(we.endDate);

        we.endDate.setDate((new Date()).getDate() + 10);

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(we)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.an('object');

            done();
        });

    });

    it('Correct update no "stillWorking" field', (done) => {

        let we = {
            institution: 'Google',
            department: 'Intern',
            beginDate: new Date('2019-01-01').toISOString(),
            endDate: new Date('2019-06-01').toISOString(),
        }

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(we)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.an('object');

            const returnedObj = {
                institution: res.body.institution,
                department: res.body.department,
                beginDate: res.body.beginDate,
                endDate: res.body.endDate,
                stillWorking: false //field is added in controller if not present
            }
            we.stillWorking = false;
            _.isEqual(returnedObj, we).should.be.eql(true);

            done();
        });

    });

    it('Invalid tutor Id', (done) => {

        chai.request(server)
        .put(`/tutors/qwerty/workexperiences/${updateWE._id}`)
        .send(workExp)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('Tutor not found', (done) => {

        chai.request(server)
        .put(`/tutors/ffffffffffffff0123456789/workexperiences/${updateWE._id}`)
        .send(workExp)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('Invalid WorkExp Id', (done) => {

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/qwerty`)
        .send(workExp)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('WorkExp not found', (done) => {

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/ffffffffffffff0123456789`)
        .send(workExp)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('Failed update: no institution', (done) => {

        let noInstCert = {...workExp};
        delete noInstCert.institution;

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(noInstCert)
        .end((err, res) => {
            shouldBeError(res, done, Errors.MISSING_FIELD);

        });

    });

    it('Failed update: no department', (done) => {

        let noTitleCert = {...workExp};
        delete noTitleCert.department;

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(noTitleCert)
        .end((err, res) => {
            shouldBeError(res, done, Errors.MISSING_FIELD);

        });

    });

    it('Failed update: no begin Date', (done) => {

        let noDateCert = {...workExp};
        delete noDateCert.beginDate;

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(noDateCert)
        .end((err, res) => {
            shouldBeError(res, done, Errors.MISSING_FIELD);

        });

    });

    it('Failed update: no end Date', (done) => {

        let noDateCert = {...workExp};
        delete noDateCert.endDate;

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(noDateCert)
        .end((err, res) => {
            shouldBeError(res, done, Errors.MISSING_FIELD);

        });

    });

    it('Failed update: endDate before beginDate (limit range)', (done) => {

        let we = {...workExp};
        we.beginDate = new Date('1990-04-12').toISOString();
        we.endDate = new Date('1990-04-11').toISOString();

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(we)
        .end((err, res) => {
            shouldBeError(res, done, Errors.DATE_ORDER);

        });
    });

    it('Failed update: endDate before beginDate (lower range)', (done) => {

        let we = {...workExp};
        we.beginDate = new Date('1990-04-12').toISOString();
        we.endDate = new Date('1900-01-01').toISOString();

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(we)
        .end((err, res) => {
            shouldBeError(res, done, Errors.DATE_ORDER);

        });
    });

    it('Failed update: endDate = beginDate', (done) => {

        let we = {...workExp};
        we.beginDate = new Date('1990-04-12').toISOString();
        we.endDate = new Date('1900-04-12').toISOString();

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(we)
        .end((err, res) => {
            shouldBeError(res, done, Errors.DATE_ORDER);

        });
    });

    it('Failed update: institution too short', (done) => {

        let certCopy = {...workExp};
        certCopy.institution = "l";

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.SHORT_STRING);

        });

    });

    it('Failed update: department too short', (done) => {

        let certCopy = {...workExp};
        certCopy.department = "l";

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.SHORT_STRING);

        });

    });

    it('Failed update: beginDate wrong format', (done) => {

        let certCopy = {...workExp};
        certCopy.beginDate = "99/1212";

        certCopy.stillWorking = true;

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_FORMAT);

        });

    });

    it('Failed update: endDate wrong format', (done) => {

        let certCopy = {...workExp};
        certCopy.endDate = "99/1212";

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_FORMAT);

        });

    });

    it('Failed update: beginDate invalid value', (done) => {

        let certCopy = {...workExp};
        certCopy.beginDate = '1999-200-200';

        certCopy.stillWorking = true;

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_FORMAT);

        });

    });

    it('Failed update: endDate invalid value', (done) => {

        let certCopy = {...workExp};
        certCopy.endDate = '2020-200-100';

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_FORMAT);

        });

    });

    it('Failed update: beginDate is in the future', (done) => {

        let certCopy = {...workExp};
        certCopy.beginDate = new Date();
        certCopy.beginDate.setDate(certCopy.beginDate.getDate() + 1);

        certCopy.endDate = new Date();
        certCopy.endDate.setDate(certCopy.beginDate.getDate() + 10);

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.DATE_IN_FUTURE);

        });

    });

    it('Failed update: endDate is in the future', (done) => {

        let certCopy = {...workExp};

        certCopy.endDate = new Date();
        certCopy.endDate.setDate(certCopy.endDate.getDate() + 10);

        chai.request(server)
        .put(`/tutors/${dbTutor._id}/workexperiences/${updateWE._id}`)
        .send(certCopy)
        .end((err, res) => {
            shouldBeError(res, done, Errors.DATE_IN_FUTURE);

        });

    });


});

describe ('WorkExp DELETE', () => {

    let dbTutor;
    let existingWE;

    before(done => {
        db.connectDB()
        .then(async () => {

            dbTutor = await User.findOne({ 'email': tutors[2].email }).exec();

            existingWE = dbTutor.tutorDetails.workExperiences[0];

            db.disconnectDB()

            done();
        })
        .catch(err => {
            done(new Error(err));
        });

    });


    it('Invalid tutor Id', (done) => {

        chai.request(server)
        .delete(`/tutors/qwerty/workexperiences/${existingWE._id}`)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('Tutor not found', (done) => {


        chai.request(server)
        .delete(`/tutors/ffffffffffffff0123456789/workexperiences/${existingWE._id}`)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('Invalid certification Id', (done) => {

        chai.request(server)
        .delete(`/tutors/${dbTutor._id}/workexperiences/qwerty`)
        .end((err, res) => {
            shouldBeError(res, done, Errors.INVALID_ID);
        });

    });

    it('Certification not found', (done) => {


        chai.request(server)
        .delete(`/tutors/${dbTutor._id}/workexperiences/ffffffffffffff0123456789`)
        .end((err, res) => {
            shouldBeNotFound(res, done);
        });

    });

    it('Correct deletion', (done) => {

        chai.request(server)
        .delete(`/tutors/${dbTutor._id}/workexperiences/${existingWE._id}`)
        .end((err, res) => {
            res.should.have.status(200);

            chai.request(server)
            .get(`/tutors/${dbTutor._id}/workexperiences/`)
            .end((err, res) => {

                res.should.have.status(200);
                res.body.should.be.an('array').that.is.empty;

                done();
                
            });
        });

    });













































































































































































































































































































































































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    






























































































































































































































































































    
});