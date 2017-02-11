"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var tiamat_1 = require("@samizdatjs/tiamat");
var reporters_1 = require("./reporters");
var fs_1 = require("./fs");
exports.DirectoryProvider = fs_1.DirectoryProvider;
exports.FileProvider = fs_1.FileProvider;
var yaml_1 = require("./yaml");
exports.YamlProvider = yaml_1.YamlProvider;
var server_1 = require("./server");
exports.server = server_1.server;
exports.router = server_1.router;
exports.get = server_1.get;
exports.Server = server_1.Server;
var rest_1 = require("./rest");
exports.ReadOnlyRestProvider = rest_1.ReadOnlyRestProvider;
var content_1 = require("./content");
exports.CollectionController = content_1.CollectionController;
exports.DocumentController = content_1.DocumentController;
exports.DocumentError = content_1.DocumentError;
__export(require("./content/interfaces"));
__export(require("./content/decorators"));
var fs_2 = require("./fs");
var content_2 = require("./content");
var server_2 = require("./server");
var Tashmetu = (function () {
    function Tashmetu() {
    }
    return Tashmetu;
}());
Tashmetu = __decorate([
    tiamat_1.component({
        entities: [
            fs_2.FileSystemService,
            content_2.MinimongoCache,
            server_2.ServerActivator,
            content_2.DatabaseService,
            content_2.StreamActivator,
            reporters_1.DatabaseReporter,
            reporters_1.FileSystemReporter,
            reporters_1.RequestReporter
        ]
    })
], Tashmetu);
exports.Tashmetu = Tashmetu;
