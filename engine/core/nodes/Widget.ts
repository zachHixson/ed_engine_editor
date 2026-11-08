export enum WIDGET_TYPE {
    ENUM = 1,
    KEY,
    MOUSE_BTN,
    TEXT_AREA,
    DIRECTION,
    VAR_INFO,
};

type NewWidget<WidgetType extends WIDGET_TYPE, Template extends {template: unknown, widget: unknown}> = {
    template: {type: WidgetType} & Template['template'];
    widget: {type: WidgetType} & Template['widget'];
};

type WidgetEnumOptions = {
    stringItems?: Array<string>;
    items?: Array<{
        name: string,
        id: number | string,
        value: unknown,
        thumbnail?: ImageData,
    }>;
    showSearch?: boolean;
    showThumbnail?: boolean;
};

export type WidgetEnum = NewWidget<WIDGET_TYPE.ENUM, {
    template: {
        options: WidgetEnumOptions
    };
    widget: {
        data: string;
        options: WidgetEnumOptions;
    };
}>;

export type WidgetKey = NewWidget<WIDGET_TYPE.KEY, {
    template: {};
    widget: {
        data: {
            code: string | null;
            key: string | null;
        };
    };
}>;

export type WidgetTextArea = NewWidget<WIDGET_TYPE.TEXT_AREA, {
    template: {};
    widget: {
        data: string;
    };
}>;

type WidgetDirectionOptions = {
    startDir?: [number, number];
};

export type WidgetDirection = NewWidget<WIDGET_TYPE.DIRECTION, {
    template: {
        options: WidgetDirectionOptions;
    };
    widget: {
        data: [number, number];
        options: WidgetDirectionOptions;
    };
}>;

type WidgetVarInfoOptions = {
    name: string;
    type: string;
    isGlobal: boolean;
};

export type WidgetVarInfo = NewWidget<WIDGET_TYPE.VAR_INFO, {
    template: {};
    widget: {
        options?: WidgetVarInfoOptions;
    };
}>;

type AllWidgets =
    WidgetEnum |
    WidgetKey |
    WidgetTextArea |
    WidgetDirection |
    WidgetVarInfo;

export type Widget_Template = AllWidgets['template'];
export type Widget = AllWidgets['widget'];
