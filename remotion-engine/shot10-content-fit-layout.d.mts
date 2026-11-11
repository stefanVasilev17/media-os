export type Shot10ContentCardCopy={heading:string;primary:string};
export type Shot10CaptionCopy={main:string;detail:string};
export type Shot10Dimensions={width:number;height:number};
export declare function shot10TextWidth(value:string,fontSize:number):number;
export declare function shot10ContentCardSize(value:Shot10ContentCardCopy):Shot10Dimensions;
export declare function shot10CaptionSize(value:Shot10CaptionCopy):Shot10Dimensions;
export declare function shot10DbMeterSize(label?:string):Shot10Dimensions;
export declare function shot10TweenSize(
  previous:Shot10Dimensions,target:Shot10Dimensions,progress:number
):Shot10Dimensions;
