export type Shot09PolicyCopy={heading:string;line:string;hasChips?:boolean};
export type Shot09LabelDimensions={width:number;height:number};
export declare function shot09PolicyPanelSize(copy:Shot09PolicyCopy):Shot09LabelDimensions;
export declare function shot09TweenPanelSize(previous:Shot09LabelDimensions,target:Shot09LabelDimensions,progress:number):Shot09LabelDimensions;
export declare function shot09AdmissionStatusSize(probeReveal:number):Shot09LabelDimensions;
