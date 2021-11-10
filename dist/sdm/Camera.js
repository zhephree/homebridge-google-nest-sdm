"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Camera = void 0;
const Device_1 = require("./Device");
const Commands = __importStar(require("./Commands"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ImageQueue_1 = require("./ImageQueue");
const lodash_1 = __importDefault(require("lodash"));
const Events = __importStar(require("./Events"));
class Camera extends Device_1.Device {
    constructor() {
        super(...arguments);
        this.imageQueue = new ImageQueue_1.ImageQueue(this.getDisplayName(), this.log);
    }
    getDisplayName() {
        return this.displayName ? this.displayName + ' Camera' : 'Unknown';
    }
    async getSnapshot() {
        const image = this.imageQueue.get();
        if (image)
            return image;
        //Nest cams do not have any method to get a current snapshot,
        //starting streams up just to retrieve one is slow and will cause
        //the SDM API to hit a rate limit of creating too many streams
        return await fs_1.default.promises.readFile(path_1.default.join(__dirname, "..", "res", "nest-logo.jpg"));
    }
    getResolutions() {
        return [[1280, 720, 15], [1920, 1080, 15]];
    }
    async getEventImage(eventId) {
        try {
            const generateResponse = await this.executeCommand(Commands.Constants.CameraEventImage_GenerateImage, {
                eventId: eventId
            });
            const imageResponse = await axios_1.default.get(generateResponse.url, {
                headers: {
                    'Authorization': 'Basic ' + generateResponse.token
                },
                responseType: 'arraybuffer'
            });
            const buffer = Buffer.from(imageResponse.data, 'binary');
            this.imageQueue.put(buffer);
        }
        catch (error) {
            this.log.error(error);
        }
    }
    async getStreamInfo() {
        return this.executeCommand(Commands.Constants.CameraLiveStream_GenerateRtspStream);
    }
    async stopStream(extensionToken) {
        return this.executeCommand(Commands.Constants.CameraLiveStream_StopRtspStream, {
            streamExtensionToken: extensionToken
        });
    }
    event(event) {
        lodash_1.default.forEach(event.resourceUpdate.events, (value, key) => {
            switch (key) {
                case Events.Constants.CameraMotion:
                    this.getEventImage(value.eventId);
                    break;
                case Events.Constants.CameraPerson:
                    this.getEventImage(value.eventId);
                    break;
                case Events.Constants.CameraSound:
                    this.getEventImage(value.eventId);
                    break;
            }
        });
    }
}
exports.Camera = Camera;
//# sourceMappingURL=Camera.js.map