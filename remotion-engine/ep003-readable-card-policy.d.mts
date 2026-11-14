export declare const EP003_CARD_FADE_IN_FRAMES:number;
export declare const EP003_CARD_FADE_OUT_FRAMES:number;
export declare const EP003_CARD_MIN_TOTAL_SECONDS:number;
export declare function ep003MinReadableCardFrames(eyebrow:string,line:string,fps?:number):number;
export declare function ep003CardIsReadable(eyebrow:string,line:string,fromFrame:number,toFrame:number,fps?:number):boolean;
export declare function ep003CardOpacity(frame:number,fromFrame:number,toFrame:number):number;
