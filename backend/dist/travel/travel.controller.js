"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelController = void 0;
const common_1 = require("@nestjs/common");
const travel_service_1 = require("./travel.service");
let TravelController = class TravelController {
    travel;
    constructor(travel) {
        this.travel = travel;
    }
    search(q) {
        return this.travel.searchPlaces(q);
    }
    reverse(lat, lon) {
        return this.travel.reverseGeocode({ lat: parseFloat(lat), lon: parseFloat(lon) });
    }
    metrics(srcLat, srcLon, dstLat, dstLon) {
        return this.travel.timezoneAndDistance({ lat: parseFloat(srcLat), lon: parseFloat(srcLon) }, { lat: parseFloat(dstLat), lon: parseFloat(dstLon) });
    }
    nearby(lat, lon) {
        return this.travel.nearbyPlaces({ lat: parseFloat(lat), lon: parseFloat(lon) });
    }
};
exports.TravelController = TravelController;
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TravelController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('reverse'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lon')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TravelController.prototype, "reverse", null);
__decorate([
    (0, common_1.Get)('metrics'),
    __param(0, (0, common_1.Query)('srcLat')),
    __param(1, (0, common_1.Query)('srcLon')),
    __param(2, (0, common_1.Query)('dstLat')),
    __param(3, (0, common_1.Query)('dstLon')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], TravelController.prototype, "metrics", null);
__decorate([
    (0, common_1.Get)('nearby'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lon')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TravelController.prototype, "nearby", null);
exports.TravelController = TravelController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [travel_service_1.TravelService])
], TravelController);
//# sourceMappingURL=travel.controller.js.map