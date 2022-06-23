'use strict';
const util = require('util');
const axios = require("axios");

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
    console.log("body: " + util.inspect(req.body));
    console.log("headers: " + req.headers);
    console.log("trailers: " + req.trailers);
    console.log("method: " + req.method);
    console.log("url: " + req.url);
    console.log("params: " + util.inspect(req.params));
    console.log("query: " + util.inspect(req.query));
    console.log("route: " + req.route);
    console.log("cookies: " + req.cookies);
    console.log("ip: " + req.ip);
    console.log("path: " + req.path);
    console.log("host: " + req.host);
    console.log("fresh: " + req.fresh);
    console.log("stale: " + req.stale);
    console.log("protocol: " + req.protocol);
    console.log("secure: " + req.secure);
    console.log("originalUrl: " + req.originalUrl);
}

/*
 * POST Handler for / route of Activity (this is the edit route).
 */
exports.edit = (req, res) => {
    logData(req);
    res.send(200, 'Edit');
};

/*
 * POST Handler for /save/ route of Activity.
 */
exports.save = (req, res) => {
    logData(req);
    res.send(200, 'Save');
};

/*
 * POST Handler for /execute/ route of Activity.
 */
exports.execute = function (req, res) {
    console.log(JSON.stringify(req.headers));
    JWT(req.body, process.env.jwtSecret, async (err, decoded) => {
        // verification error -> unauthorized request
        if (err) {
            console.error(err);
            return res.status(401).end();
        }
        if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
            console.log('##### decoded ####=>', decoded);
            const { brokerSmsApiURL, brokerSecret, brokerUserKey, testPhone } = process.env;
            await axios.post(
                `${brokerSmsApiURL}/v1/cdpbroker-test/online_loader/notificacion/cargarnotificacionDn/sms/`,
                {
                    bill_number: testPhone,
                    mensaje: "Prueba CA CDP Claro",
                    subject: "[Cobertura] ",
                    urgente: 1,
                    validar: 0
                },
                {
                    headers: {
                        Authorization: `Basic ${brokerSecret}`,
                        user_key: brokerUserKey
                    }
                }
            )
                .then((res) => {
                    console.log('Response:');
                    console.log(res.data);
                })
                .catch((error) => {
                    console.log('Error:');
                    console.log(error);
                });
            res.send(200, 'Execute');
        } else {
            console.error('inArguments invalid.');
            return res.status(400).end();
        }
    });
};

/*
 * POST Handler for /publish/ route of Activity.
 */
exports.publish = (req, res) => {
    logData(req);
    res.send(200, 'Publish');
};

/*
 * POST Handler for /validate/ route of Activity.
 */
exports.validate = (req, res) => {
    logData(req);
    res.send(200, 'Validate');
};

/*
 * POST Handler for /Stop/ route of Activity.
 */
exports.stop = (req, res) => {
    logData(req);
    res.send(200, 'Stop');
};

/**
 * This function relies on the environment variables being set.
 * 
 * This function invokes the enhanced package authentication.
 * This would return an access token that can be used to call additional Marketing Cloud APIs.
 * 
 */
const retrieveToken = () => {
    axios.post(
        `${process.env.authenticationUrl}/v2/token`,
        {
            grant_type: 'client_credentials',
            client_id: process.env.clientId,
            client_secret: process.env.clientSecret
        }
    )
        .then(response => response.data['access_token'])
        .catch(error => error);
};
