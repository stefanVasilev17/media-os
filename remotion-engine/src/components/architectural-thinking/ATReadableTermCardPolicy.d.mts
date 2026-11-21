export declare const AT_GLOSSARY_FADE_IN_FRAMES:18;
export declare const AT_GLOSSARY_FADE_OUT_FRAMES:20;
export declare const AT_GLOSSARY_MIN_TOTAL_SECONDS:5.5;
export declare function atGlossaryTextWidth(value:string,fontSize:number):number;
export declare function atGlossaryMinReadableFrames(eyebrow:string,line:string,fps?:number):number;
export declare function atGlossaryCardIsReadable(
  eyebrow:string,line:string,fromFrame:number,toFrame:number,fps?:number):boolean;
export declare function atGlossaryCardOpacity(
  frame:number,fromFrame:number,toFrame:number):number;
