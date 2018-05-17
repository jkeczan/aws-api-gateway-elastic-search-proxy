'use strict';

let es = require('./es');
let aws = require('aws-sdk');
let lambda = new aws.Lambda();
let jwt = require('jsonwebtoken');
let q = require('q');

exports.handler = (event, context, callback) => {
    console.log("Event: ", JSON.stringify(event));

    let formattedPath = event.path.replace('/search', '/_search');

    performES(event, formattedPath).then(function (data) {
        callback(null, data);
    }).catch(function (err) {
        callback(err, null);
    });
};

function performES(event, formattedPath) {

    return es[event.httpMethod.toLowerCase()](formattedPath, event.body).then((result) => {
        console.log("Valid Proxy", result);
        let response = {
            statusCode: 200,
            headers: {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            body: JSON.stringify(result)
        };
        if (event.path.indexOf("datapointcount") > -1) {
            console.log("Responding with ONLY count of data points: ", result.hits.total);
            response.body = JSON.stringify(result.hits.total);
        }
        return response
    }).catch((err) => {
        let response = {
            statusCode: err.statusCode,
            headers: {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            body: JSON.stringify(err)
        };
        console.log("Proxy Failed");
        console.log(response);
        return response
    });

}
