"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var reportWebVitals = function (onPerfEntry) {
    if (onPerfEntry && onPerfEntry instanceof Function) {
        Promise.resolve().then(function () { return require('web-vitals'); }).then(function (_a) {
            var onCLS = _a.onCLS, onINP = _a.onINP, onFCP = _a.onFCP, onLCP = _a.onLCP, onTTFB = _a.onTTFB;
            onCLS(onPerfEntry);
            onINP(onPerfEntry);
            onFCP(onPerfEntry);
            onLCP(onPerfEntry);
            onTTFB(onPerfEntry);
        });
    }
};
exports.default = reportWebVitals;
