export type Shot11LargeAmberCue='ONE_DATABASE'|'REJECT_EXCESS'|'FAST_FAILURE'|'HEALTHY_NOT_AVAILABLE'|'ONE_DB_QUESTION';
export type Shot11LargeAmberContent={cue:Shot11LargeAmberCue;eyebrow:string;headline:string;featured:boolean};
export declare const SHOT11_LARGE_AMBER_STORY:readonly Readonly<Shot11LargeAmberContent>[];
export declare function shot11LargeAmberSize(content:{eyebrow:string;headline:string;featured?:boolean}):{
  width:number;height:number;headingFont:number;headlineFont:number
};
export declare function shot11LargeAmberIndex(frame:number,positions:Readonly<Record<Shot11LargeAmberCue,number>>):number;
