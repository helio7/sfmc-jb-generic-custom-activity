'use strict';
const axios = require("axios");
const https = require("https");
const { performance } = require("perf_hooks");

exports.logExecuteData = [];
const logData = (req) => { // Log data from the request and put it in an array accessible to the main app.
    exports.logExecuteData.push({
        body: req.body,
        headers: req.headers,
        trailers: req.trailers,
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        route: req.route,
        cookies: req.cookies,
        ip: req.ip,
        path: req.path,
        host: req.host,
        fresh: req.fresh,
        stale: req.stale,
        protocol: req.protocol,
        secure: req.secure,
        originalUrl: req.originalUrl
    });
}

const JWT = (body, secret, cb) => {
	if (!body) return cb(new Error('invalid jwtdata'));
	require('jsonwebtoken').verify(body.toString('utf8'), secret, { algorithm: 'HS256' }, cb);
};

exports.execute = (req, res) => {
    JWT(req.body, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            console.error(err);
            return res.status(401).end();
        }
        if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
            const { value, expiresAt } = req.app.locals.token;

            let phone = '';
            for (const argument of decoded.inArguments) {
                if (argument.cellularNumber) {
                    phone = argument.cellularNumber;
                    break;
                }
            }

            const now = new Date();

            let balanceValidationFailed = false;

            const httpsAgent = new https.Agent({ rejectUnauthorized: false });

            if (value === null || expiresAt < now) {
                const { TOKEN_API_URL, TOKEN_API_USERNAME, TOKEN_API_PASSWORD } = process.env;

                const tokenRequestDurationTimestamps = { start: performance.now(), end: null };
                const token = await axios({
                    method: 'post',
                    url: TOKEN_API_URL,
                    data: {
                        username: TOKEN_API_USERNAME,
                        password: TOKEN_API_PASSWORD
                    },
                    httpsAgent,
                })
                    .then((res) => {
                        if (res.headers.authorization) return res.headers.authorization.substring(7);
                    })
                    .catch((err) => {
                        tokenRequestDurationTimestamps.end = performance.now();
                        if (err.response) {
                            const { data, status } = err.response;
                            specialConsoleLog(phone, 'TOKEN_REQUEST_ERROR', tokenRequestDurationTimestamps, { data, status });
                        }
                        console.log('Error:');
                        console.log(err);
                    });
                if (!token) balanceValidationFailed = true;
                else {
                    req.app.locals.token = {
                        value: token,
                        expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 23),
                    };
                }
            }

            if (!balanceValidationFailed) {
                const {
                    API_URL,
                    API_COUNTRY,
                    API_SESSION_ID
                } = process.env;

                const requestBody = {
                    cellularNumber: phone,
                    channel: "PDC"
                };

                const packRenovableApiResponse = await axios({
                    method: 'post',
                    url: API_URL,
                    headers: {
                        Country: API_COUNTRY,
                        'Session-Id': API_SESSION_ID
                    },
                    data: requestBody,
                    httpsAgent,
                })
                    .then((res) => {
                        let responseCode, responseMessage, packId, handle;

                        if (res.data.code) {
                            responseCode = res.data.code;
                            responseMessage = res.data.description;
                        } else {
                            responseCode = res.data.responseCode;
                            responseMessage = res.data.responseMessage;
                            packId = res.data.pack?.packId;
                            handle = res.data.handle;
                        }

                        return { responseCode, responseMessage, packId, handle };
                    })
                    .catch((err) => {
                        if (err.response) {
                            const { data, status } = err.response;
                            specialConsoleLog(phone, 'PACK_REQUEST_ERROR', { data, status });
                        }
                        console.log('Error:');
                        console.log(err);
                        return { responseCode: '', responseMessage: '', packId: '', handle: '' };
                    });

            }

            res.setHeader('Content-Type', 'application/json');
            res.status(200);
            // res.end(result);
        } else {
            console.error('inArguments invalid.');
            return res.status(400).end();
        }
    });
};

exports.edit = (req, res) => {
    logData(req);
    res.send(200, 'Edit');
};

exports.save = (req, res) => {
    logData(req);
    res.send(200, 'Save');
};

exports.publish = (req, res) => {
    logData(req);
    res.send(200, 'Publish');
};

exports.validate = (req, res) => {
    logData(req);
    res.send(200, 'Validate');
};

exports.stop = (req, res) => {
    logData(req);
    res.send(200, 'Stop');
};

function millisToMinutesAndSeconds(millis) {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return Number(seconds) == 60 ? minutes + 1 + 'm' : minutes + 'm ' + (Number(seconds) < 10 ? '0' : '') + seconds + 's';
}

function specialConsoleLog(phoneNumber, eventName, data) {
    const now = new Date();
    const todayDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const currentTime = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    const jsonifiedData = JSON.stringify(data);

    console.log(`${todayDate}|${currentTime}|${phoneNumber}|${eventName}|${jsonifiedData}`);
}
