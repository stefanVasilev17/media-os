export declare const SHOT01_UNIFIED_PASS:'SHOT01_SHOT02_UNIFIED_V2';
export declare function shot01UnifiedEase(frame:number,begin:number,end:number):number;
export declare function requireShot01RealCues(duration:number,starts:readonly number[]|undefined,mode:string|undefined):readonly number[];
export declare function shot01UnifiedState(frame:number,duration:number,starts:readonly number[]):{
 closing:number;press:number;waiting:number;health:number;focus:number;rail:number;
 rewindActive:number;cameraX:number;cameraY:number;cameraScale:number;
 canonicalFrame:number;packetProgress:number;packetVisible:boolean;
};