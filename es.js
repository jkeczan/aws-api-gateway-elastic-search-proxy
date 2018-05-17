'use strict';

let AWS = require('aws-sdk');
let aws4 = require('aws4');
let got = require('got');

const region = process.env.region;
const host = process.env.host || 'search-fieldservices-krh6etkcukqf2ojq2o5l7zanfe.us-east-1.es.amazonaws.com';
const awsConfig = new AWS.Config({region});

function request(options) {
    const opts = Object.assign({
        host,
        region: awsConfig.region,
        protocol: 'https:',
        headers: {
            'Accept': '*/*',
            'Content-Type':"application/json"
        },
        json: true
    }, options);

    try {
        var testJSON = JSON.parse(opts.body);
        console.log("Valid JSON")
    } catch(e) {
        opts.body = JSON.stringify(opts.body);
        console.log("Needed Encoding")
    }

    aws4.sign(opts, awsConfig.credentials);
    const method = opts.method;
    const path = opts.path;
    const body = opts.body;

    console.log(JSON.stringify({method, path, host, body}), 'Performing request');
    console.log(opts);

    return Promise.resolve(got(opts)).then(resp => resp.body).catch((err) => {
        console.log("Got Request Error", err);
    });
}

const es = {};

const METHODS = [
    'get',
    'post',
    'put',
    'delete'

];

METHODS.forEach(method => {
    es[method] = (path, body) => {
        if (!body) {
            body = {};
        }

        return request({
            path,
            method: method.toUpperCase(),
            body: body
        })
    }
});

es.bulk = ops => request({
    path: '/_bulk',
    method: 'POST',
    body: ops.map(op => `${JSON.stringify(op)}\n`).join('')
});

es.getRecord = function (index, type, id) {
    es.get(`${index}/${type}/${id}`);
};
es.indexRecord = function (index, type, id, body) {
    es.put(`/${index}/${type}/${id}`, body);
};
es.deleteRecord = function (index, type, id) {
    es.delete(`/${index}/${type}/${id}`);
};

module.exports = es;